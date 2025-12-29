require('@testing-library/jest-dom');
const React = require('react');

// Mock next/router
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
        reload: jest.fn(),
        pathname: '/',
        route: '/',
        query: {},
        asPath: '/',
    }),
    usePathname: jest.fn().mockReturnValue('/'),
    useSearchParams: jest.fn().mockReturnValue(new URLSearchParams()),
}));

// Mock next-intl
jest.mock('next-intl', () => ({
    useTranslations: () => (key) => key,
    useLocale: () => 'en',
    Link: jest.fn().mockImplementation(({ children, ...props }) => (
        <a {...props}>{children}</a>
    )),
}));

// Mock MongoDB
jest.mock('@/lib/mongodb', () => ({
    __esModule: true,
    default: jest.fn().mockResolvedValue(true),
}));

// Mock OpenAI
jest.mock('openai', () => ({
    OpenAI: jest.fn().mockImplementation(() => ({
        chat: {
            completions: {
                create: jest.fn().mockResolvedValue({
                    choices: [{ message: { content: 'Mocked AI Response' } }],
                }),
            },
        },
    })),
}));

// Mock next-auth
jest.mock('next-auth', () => ({
    getServerSession: jest.fn().mockResolvedValue({
        user: {
            id: 'mock-user-id',
            name: 'Mock User',
            email: 'mock@example.com',
            role: 'patient',
        },
    }),
}));

// Create a mock for window.MediaStream for video call tests
class MockMediaStream {
    constructor() {
        this.active = true;
        this.id = 'mock-stream-id';
    }

    getTracks() {
        return [{ stop: jest.fn() }];
    }

    getVideoTracks() {
        return [{ enabled: true }];
    }

    getAudioTracks() {
        return [{ enabled: true }];
    }
}

global.MediaStream = MockMediaStream;
global.navigator.mediaDevices = {
    getUserMedia: jest.fn().mockResolvedValue(new MockMediaStream()),
};

// Needed for socket.io-client
global.WebSocket = jest.fn();
