# Video Calling Test Instructions

## How to Test Real WebRTC Video Calling

The healthcare platform now includes **real WebRTC peer-to-peer video calling** between doctors and patients.

### Test Setup

1. **Deploy to Vercel** (or ensure both users can access the same server)
2. **Create two user accounts** with different roles:
   - Patient: `patient@test.com` / `patient123`
   - Doctor: `doctor@test.com` / `doctor123`

### Testing Steps

#### Option 1: Using Test Page (Recommended)

1. **Device 1 (Doctor):**
   - Sign in as doctor (`doctor@test.com` / `doctor123`)
   - Navigate to `/test-video`
   - Click "Start Consultation"

2. **Device 2 (Patient):**
   - Sign in as patient (`patient@test.com` / `patient123`)
   - Navigate to `/test-video`
   - Click "Start Consultation"

#### Option 2: Using Real Appointment Flow

1. **Patient books appointment:**
   - Sign in as patient
   - Go to dashboard → Book appointment
   - Select a doctor and schedule meeting

2. **Both users join meeting:**
   - Navigate to the scheduled meeting
   - Click "Start Consultation"

### Expected Behavior

✅ **What Should Work:**
- Both users see their own video feed (local)
- Both users see each other's video feed (remote)
- Audio communication between participants
- Mute/unmute functionality
- Video on/off functionality
- Screen sharing (replaces video track)
- Connection quality indicators

### Technical Implementation

#### WebRTC Flow:
1. **Doctor initiates** (creates offer)
2. **Patient responds** (creates answer)
3. **ICE candidates exchanged** for NAT traversal
4. **Peer connection established**
5. **Media streams shared** directly between browsers

#### Signaling Server:
- **API Endpoint:** `/api/meetings/[id]/signal`
- **Method:** HTTP polling (every 2 seconds)
- **Storage:** In-memory (production should use Redis)
- **Authentication:** NextAuth session-based

#### STUN Servers Used:
- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`
- `stun:stun2.l.google.com:19302`

### Troubleshooting

#### If video doesn't work:
1. **Check browser permissions** (camera/microphone)
2. **Ensure HTTPS** (required for getUserMedia)
3. **Check network** (corporate firewalls may block WebRTC)
4. **Open browser console** for error messages
5. **Try different browsers** (Chrome/Firefox recommended)

#### If connection fails:
1. **Check signaling API** (`/api/meetings/[id]/signal`)
2. **Verify both users are authenticated**
3. **Ensure meeting ID is valid**
4. **Check STUN server connectivity**

### Production Considerations

For production deployment:

1. **Use Redis** for signaling storage (instead of in-memory)
2. **Add TURN servers** for users behind strict NATs
3. **Implement Socket.io** for real-time signaling (instead of polling)
4. **Add error recovery** and reconnection logic
5. **Implement recording** functionality
6. **Add bandwidth adaptation**

### Security Notes

- All communication is **peer-to-peer** (not routed through server)
- **HTTPS required** for WebRTC functionality
- **Session-based authentication** for signaling API
- **Meeting access control** based on user roles

The implementation provides a solid foundation for real-time video consultations with proper WebRTC peer connections!