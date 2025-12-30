import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
    try {
        const { name, email, password, role, specialty } = await request.json();

        // Input validation
        if (!name || !email || !password) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate role
        const validRoles = ['patient', 'provider'];
        const userRole = validRoles.includes(role) ? role : 'patient';

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Password validation (min 8 characters)
        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters long' },
                { status: 400 }
            );
        }

        // Validate specialty for providers
        if (userRole === 'provider' && !specialty) {
            return NextResponse.json(
                { error: 'Specialty is required for healthcare providers' },
                { status: 400 }
            );
        }

        // Connect to database
        await connectDB();

        // Check if user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 409 }
            );
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user with role-specific profile
        const userData: {
            name: string;
            email: string;
            password: string;
            role: string;
            profile?: {
                specialty?: string;
                yearsExperience?: number;
                bio?: string;
            };
        } = {
            name,
            email,
            password: hashedPassword,
            role: userRole,
        };

        // Add provider-specific fields
        if (userRole === 'provider') {
            userData.profile = {
                specialty: specialty,
                yearsExperience: 0,
                bio: '',
            };
        }

        const newUser = new User(userData);
        await newUser.save();

        // Return success without exposing password
        return NextResponse.json({
            success: true,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'An error occurred during registration' },
            { status: 500 }
        );
    }
}
