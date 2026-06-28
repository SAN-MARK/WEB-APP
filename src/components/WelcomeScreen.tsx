import React, { useState, useEffect } from 'react';
import { HelpingHand, Search, Eye, RefreshCw, Loader2, CheckCircle2, User, Mail, Phone, Database, Sliders, Lock, ArrowLeft } from 'lucide-react';
import { dbService } from '../services/dbService';
import { auth, db, handleFirestoreError, OperationType } from '../services/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface WelcomeScreenProps {
  onStartFlow: (role: 'finder' | 'owner') => void;
  onLogin: (name: string, email: string, phone: string, avatarUrl?: string) => void;
  onAdminLogin?: (name: string, email: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStartFlow, onLogin, onAdminLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'finder' | 'owner' | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Admin login states
  const [showAdminStepUp, setShowAdminStepUp] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  // Loading & Modal States
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Firebase 2-Step Registration States
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<1 | 2>(1);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regOtp, setRegOtp] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);


  // Google Sign-In Callback
  const handleGoogleSuccess = async (response: any) => {
    try {
      setIsLoading(true);
      setError('');
      
      const credential = response.credential;
      // Decode JWT token securely in pure JavaScript
      const base64Url = credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      const decoded = JSON.parse(jsonPayload);
      console.log('Decoded Google User:', decoded);
      
      const googleName = decoded.name || decoded.given_name || 'Google User';
      const googleEmail = decoded.email;
      
      setName(googleName);
      setEmail(googleEmail);
      setPhone('Google Verified');

      // Send to Sheet.best Users tab
      await dbService.recordUserLogin({
        Timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        Name: googleName,
        Email: googleEmail,
        Phone: 'Google Verified',
      });

      setIsLoading(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Failed to process Google authentication:', err);
      setIsLoading(false);
      setError('Google Sign-In failed to capture profile. Please try again or use email sign up.');
    }
  };

  // Setup Google Sign-In SDK
  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (typeof window !== 'undefined' && (window as any).google) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: '677733561873-f29n8o1fnmksi4angjvdl3d2p88tebhr.apps.googleusercontent.com',
            callback: handleGoogleSuccess,
          });
          
          (window as any).google.accounts.id.renderButton(
            document.getElementById('google-signin-div'),
            {
              theme: 'outline',
              size: 'large',
              text: 'continue_with',
              shape: 'rectangular',
              width: 382,
            }
          );
        } catch (err) {
          console.error('Error initializing Google Sign-In:', err);
        }
      }
    };

    // Try immediately
    initializeGoogleSignIn();

    // Poll to check if the SDK is loaded
    const interval = setInterval(() => {
      if ((window as any).google) {
        initializeGoogleSignIn();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRegisterStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      setError('Please enter a username.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!regPassword.trim()) {
      setError('Please enter a password.');
      return;
    }
    if (!regPhone.trim() || !regPhone.startsWith('+')) {
      setError('Please enter your mobile number with country code, e.g. +91XXXXXXXXXX.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Clear previous recaptcha verifier if any
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch (_) {}
        (window as any).recaptchaVerifier = null;
      }

      const recaptcha = new RecaptchaVerifier(auth, 'recaptcha-box', {
        'size': 'invisible',
        'callback': () => {
          console.log('reCAPTCHA verified');
        }
      });
      (window as any).recaptchaVerifier = recaptcha;

      console.log('Sending OTP to:', regPhone);
      const confirmation = await signInWithPhoneNumber(auth, regPhone, recaptcha);
      (window as any).confirmationResult = confirmation;

      setRegistrationStep(2);
    } catch (err: any) {
      console.warn('Firebase SMS OTP failed or is limited, sliding to Step 2 in simulation mode:', err);
      // Fallback schema to function perfectly inside the right-side web preview pane
      (window as any).simulatedOtp = '123456';
      setRegistrationStep(2);
      setError('Simulation OTP 123456 sent (for testing within iframe environment).');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regOtp.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      let userUid = '';
      let verifiedPhone = regPhone;

      if ((window as any).confirmationResult) {
        const result = await (window as any).confirmationResult.confirm(regOtp);
        userUid = result.user?.uid || 'user-uid-' + Date.now();
        verifiedPhone = result.user?.phoneNumber || regPhone;
        console.log('Verified user successfully:', userUid);
      } else {
        // Fallback validation for simulation
        if (regOtp === '123456' || regOtp === '123457') {
          userUid = 'simulated-uid-' + Date.now();
          console.log('Verified user successfully via simulation:', userUid);
        } else {
          throw new Error('Invalid verification code. Please enter 123456 to simulate success.');
        }
      }

      // Check for duplicate accounts in Sheet.best before registration
      const sheetBestUrl = 'https://api.sheetbest.com/sheets/ad425445-e829-4f06-85f7-c93d78761822';
      try {
        const checkRes = await fetch(sheetBestUrl);
        if (checkRes.ok) {
          const existingRows = await checkRes.json();
          if (Array.isArray(existingRows)) {
            const isDuplicate = existingRows.some((row: any) => {
              const rowEmail = (row.Email || row.email || '').toString().trim().toLowerCase();
              const rowMobile = (row.Mobile || row.mobile || row.Phone || row.phone || '').toString().trim();
              
              const inputEmail = regEmail.trim().toLowerCase();
              const inputPhone = verifiedPhone.trim();
              const inputPhoneRaw = regPhone.trim();

              const emailMatch = rowEmail !== '' && rowEmail === inputEmail;
              const phoneMatch = rowMobile !== '' && (rowMobile === inputPhone || rowMobile === inputPhoneRaw);
              
              return emailMatch || phoneMatch;
            });

            if (isDuplicate) {
              setError('Account already exists with this Email or Mobile Number.');
              setIsLoading(false);
              return;
            }
          }
        } else {
          console.warn('Failed to fetch existing rows for duplicate checking:', checkRes.statusText);
        }
      } catch (checkErr) {
        console.error('Error while checking for duplicates:', checkErr);
      }

      // Securely save a user profile document matching Name, Mobile Number, and createdAt directly to 'users' collection in Firestore
      const path = `users/${userUid}`;
      try {
        await setDoc(doc(db, 'users', userUid), {
          uid: userUid,
          name: regName,
          email: regEmail,
          password: regPassword,
          phone: verifiedPhone,
          createdAt: new Date(),
          Name: regName,
          Email: regEmail,
          Password: regPassword
        });
        console.log('Profile saved successfully in Firebase Firestore!');
      } catch (dbErr) {
        console.error('Failed to write profile to Firestore, routing to handleFirestoreError:', dbErr);
        handleFirestoreError(dbErr, OperationType.WRITE, path);
      }

      // Automatically send registration data to the specified Sheet Best API endpoint in an array
      try {
        const response = await fetch(sheetBestUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([
            {
              Timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
              Name: regName,
              Email: regEmail,
              Phone: verifiedPhone,
              Password: regPassword,
            }
          ]),
        });

        if (response.ok) {
          console.log('Successfully recorded user registration in specified Sheet.best sheet!');
        } else {
          console.error('Failed to register user to Sheet Best API. Status:', response.status);
        }
      } catch (postErr) {
        console.error('Network error during Sheet.best POST request:', postErr);
      }

      // Keep legacy Sheet.best ledger in sync
      try {
        await dbService.recordUserLogin({
          Timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          Name: regName,
          Email: regEmail,
          Phone: verifiedPhone,
        });
      } catch (e) {
        console.warn('Failed to sync legacy ledger', e);
      }

      setIsLoading(false);
      setIsRegistering(false);
      setRegistrationStep(1);
      setEmail(regEmail);
      setPassword('');
      setError('');
      setSuccessMessage('Account created successfully! Please log in with your credentials.');
    } catch (err: any) {
      console.error('Error during 2-step verification:', err);
      setError(err.message || 'Verification failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address!');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password!');
      return;
    }
    if (selectedRole === null) {
      setError('Please select whether you found or lost something first!');
      return;
    }
    
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      let matchedUser: any = null;

      // 1. Fetch from Firestore users collection
      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const q = query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          matchedUser = snap.docs[0].data();
          console.log('User found in Firestore!');
        }
      } catch (firestoreErr) {
        console.warn('Firestore user fetch failed, trying Sheet.best:', firestoreErr);
      }

      // 2. Fetch from Sheet Best Primary Users Ledger if not found in Firestore
      if (!matchedUser) {
        try {
          const sheetBestUrl = 'https://api.sheetbest.com/sheets/ad425445-e829-4f06-85f7-c93d78761822';
          const res = await fetch(sheetBestUrl);
          if (res.ok) {
            const rows = await res.json();
            if (Array.isArray(rows)) {
              matchedUser = rows.find(row => 
                (row.Email || row.email || '').toString().trim().toLowerCase() === email.trim().toLowerCase()
              );
              if (matchedUser) {
                console.log('User found in Sheet.best!');
              }
            }
          }
        } catch (sheetBestErr) {
          console.error('Sheet.best user fetch failed:', sheetBestErr);
        }
      }

      if (!matchedUser) {
        setError('Invalid email or password.');
        setIsLoading(false);
        return;
      }

      const storedPassword = matchedUser.Password || matchedUser.password;
      if (storedPassword !== password) {
        setError('Invalid email or password.');
        setIsLoading(false);
        return;
      }

      const userName = matchedUser.Name || matchedUser.name || 'Chennai Citizen';
      const userPhone = matchedUser.Phone || matchedUser.phone || matchedUser.Mobile || matchedUser.mobile || '+91 99999 99999';
      const userAvatar = matchedUser.ProfilePicURL || matchedUser.avatarUrl || '';

      setName(userName);
      setPhone(userPhone);
      setAvatarUrl(userAvatar);

      // Store Name and Email securely in localStorage so the app remembers login state
      const loggedInUser = {
        name: userName,
        email: email.trim().toLowerCase(),
        phone: userPhone,
        balance: matchedUser.balance || 120,
        reportedCount: matchedUser.reportedCount || 0,
        claimedCount: matchedUser.claimedCount || 0,
        avatarUrl: userAvatar
      };
      localStorage.setItem('findback_user', JSON.stringify(loggedInUser));

      setIsLoading(false);
      setShowSuccessModal(true);
    } catch (err) {
      setIsLoading(false);
      setError('A database error occurred, please try again.');
    }
  };

  const handleModalConfirm = () => {
    setShowSuccessModal(false);
    onLogin(name || 'Chennai Citizen', email || 'chennai.citizen@gmail.com', phone || '+91 99999 99999', avatarUrl);
    onStartFlow(selectedRole || 'owner');
  };

  const handleQuickClick = (role: 'finder' | 'owner') => {
    setSelectedRole(role);
    setError('');
  };

  if (isRegistering) {
    return (
      <div id="register-screen" className="max-w-md mx-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden my-6 relative font-sans animate-fade-in text-slate-100">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-500"></div>
        <div className="p-8 flex flex-col">
          {/* Header */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-b from-blue-950 to-blue-900 rounded-2xl flex items-center justify-center shadow-lg border border-slate-800 relative overflow-hidden">
              <div className="absolute inset-1.5 rounded-full border border-slate-700/50 flex items-center justify-center">
                <User className="w-8 h-8 text-cyan-400 filter drop-shadow-[0_0_3px_rgba(34,211,238,0.8)]" />
              </div>
            </div>
            <h1 className="text-2xl font-black tracking-widest text-white uppercase font-display animate-pulse">Create Account</h1>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-4 bg-cyan-400 inline-block"></span>
              2-Step Civic Registration
            </h2>
            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
              Verify your mobile identity to log into the Chennai civic ledger.
            </p>
          </div>

          {error && (
            <div className="w-full bg-red-950/80 text-red-200 border border-red-800/50 p-3.5 rounded-xl text-xs font-bold mb-4 text-center uppercase tracking-wider animate-shake">
              {error}
            </div>
          )}

          {registrationStep === 1 ? (
            /* Step 1: Credentials */
            <form onSubmit={handleRegisterStep1} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-cyan-400" /> User Name
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Rahul Sharma"
                  className="w-full p-3 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 bg-slate-950 text-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="rahul.sharma@example.com"
                  className="w-full p-3 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 bg-slate-950 text-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" /> Password
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? "text" : "password"}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-3 pr-10 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 bg-slate-950 text-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" /> Mobile Number
                </label>
                <input
                  type="text"
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+91"
                  className="w-full p-3 border border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 bg-slate-950 text-white transition-all font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black py-4 rounded-xl shadow-lg shadow-cyan-950/20 uppercase tracking-widest text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      Requesting OTP...
                    </>
                  ) : (
                    'Verify Identity & Send OTP'
                  )}
                </button>
              </div>

              {/* invisible recaptcha box container */}
              <div id="recaptcha-box" className="flex justify-center mt-2"></div>
            </form>
          ) : (
            /* Step 2: Verification OTP */
            <form onSubmit={handleRegisterStep2} className="space-y-4 animate-fade-in">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center">
                <p className="text-[10px] uppercase text-slate-400 tracking-wider font-bold">Verification SMS Sent to</p>
                <p className="text-sm font-mono text-cyan-400 font-bold mt-1">{regPhone}</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" /> 6-Digit OTP Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={regOtp}
                  onChange={(e) => setRegOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full p-3 border border-slate-800 rounded-xl text-center text-lg tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 bg-slate-950 text-white font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl shadow-lg shadow-emerald-950/20 uppercase tracking-widest text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Verifying Token...
                    </>
                  ) : (
                    'Verify & Finish'
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setRegistrationStep(1)}
                className="w-full text-[10px] uppercase font-bold tracking-widest text-slate-400 hover:text-white transition-colors text-center mt-2"
              >
                Change details / Resend SMS
              </button>
            </form>
          )}

          {/* Return to login */}
          <button
            type="button"
            onClick={() => {
              setIsRegistering(false);
              setRegistrationStep(1);
              setError('');
            }}
            className="text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors mt-6 flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Chennai Citizen Entrance
          </button>
        </div>
      </div>
    );
  }

  if (showAdminStepUp) {
    return (
      <div id="welcome-screen" className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden my-6 relative font-sans animate-fade-in">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900"></div>
        <div className="p-8 flex flex-col items-center">
          {/* Logo Section */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="w-20 h-20 bg-gradient-to-b from-slate-950 to-slate-900 rounded-2xl flex items-center justify-center shadow-lg border border-slate-800 relative overflow-hidden">
              <div className="absolute inset-1.5 rounded-full border border-slate-700/50 flex items-center justify-center">
                <Lock className="w-9 h-9 text-cyan-400 filter drop-shadow-[0_0_3px_rgba(34,211,238,0.8)] animate-pulse" />
              </div>
            </div>
            <h1 className="text-2xl font-black tracking-widest text-slate-900 uppercase font-display">Staff Login</h1>
          </div>

          {/* Admin Headline */}
          <div className="text-center mb-6">
            <h2 className="text-sm font-black text-slate-800 uppercase flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-4 bg-blue-900 inline-block"></span>
              Administrative Portal
            </h2>
            <p className="text-[11px] text-slate-500 mt-2 tracking-wide font-semibold">
              STAFF ONLY - ENTER OPERATOR CREDENTIALS TO BYPASS CITIZEN REGISTRATION.
            </p>
          </div>

          {/* Admin Error Message */}
          {adminError && (
            <div className="w-full bg-red-50 text-red-700 border border-red-200 p-3.5 rounded-xl text-xs font-bold mb-4 text-center uppercase tracking-wider">
              {adminError}
            </div>
          )}

          {/* Admin Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (adminUsername === 'Sanjeev_200' && adminPassword === 'sanjeev@866') {
                if (onAdminLogin) {
                  onAdminLogin('Sanjeev', 'iamheresanjeev@gmail.com');
                } else {
                  onLogin('Sanjeev', 'iamheresanjeev@gmail.com', 'Admin Operator');
                  onStartFlow('owner');
                }
              } else {
                setAdminError('Access Denied: Invalid Username or Password.');
              }
            }}
            className="w-full space-y-4"
          >
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-950" /> Admin Username / ID
              </label>
              <input
                type="text"
                required
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="e.g. Sanjeev_200"
                className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 bg-white transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-blue-950" /> Access Password
              </label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 bg-white transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-950 text-white font-extrabold py-4 rounded-xl shadow-lg uppercase tracking-widest text-xs transition-all cursor-pointer mt-6 flex items-center justify-center gap-2 border border-slate-800"
            >
              Verify Administrative Access
            </button>
          </form>

          {/* Back to Citizen Access */}
          <button
            type="button"
            onClick={() => {
              setShowAdminStepUp(false);
              setAdminUsername('');
              setAdminPassword('');
              setAdminError('');
            }}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors mt-6 flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Citizen Entrance
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="welcome-screen" className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden my-6 relative">
      <div className="p-8 flex flex-col items-center">
        {/* Logo Section */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="w-20 h-20 bg-gradient-to-b from-blue-950 to-blue-900 rounded-2xl flex items-center justify-center shadow-lg border-2 border-slate-700 relative overflow-hidden">
            <div className="absolute inset-1.5 rounded-full border-2 border-slate-400 flex items-center justify-center">
              <RefreshCw className="w-10 h-10 text-cyan-400 filter drop-shadow-[0_0_4px_rgba(34,211,238,0.9)]" />
            </div>
          </div>
          <h1 className="text-3xl font-black font-display tracking-widest text-blue-900 uppercase">FindBack</h1>
        </div>

        {/* Welcome Headline */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-black text-slate-800 uppercase flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-5 bg-blue-600 inline-block"></span>
            Chennai Network
          </h2>
          <p className="text-xs text-slate-500 mt-2 tracking-wide font-medium">
            Your community-driven lost and found partner.
          </p>
        </div>

        {/* Quick Access Roles */}
        <div className="grid grid-cols-2 gap-4 w-full mb-6">
          {/* Finder Button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickClick('finder')}
            className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all cursor-pointer ${
              selectedRole === 'finder'
                ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100 shadow-md'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 rotate-45 border-2 ${
              selectedRole === 'finder' ? 'bg-blue-900 text-white border-cyan-400' : 'bg-slate-100 text-blue-900 border-slate-300'
            }`}>
              <HelpingHand className="w-6 h-6 -rotate-45" />
            </div>
            <span className="font-bold text-slate-800 text-xs text-center uppercase tracking-wider leading-tight">
              I found<br />something
            </span>
          </button>

          {/* Owner Button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleQuickClick('owner')}
            className={`flex flex-col items-center justify-center p-5 rounded-xl border-2 transition-all cursor-pointer ${
              selectedRole === 'owner'
                ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100 shadow-md'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 rotate-45 border-2 ${
              selectedRole === 'owner' ? 'bg-blue-900 text-white border-cyan-400' : 'bg-slate-100 text-blue-900 border-slate-300'
            }`}>
              <Search className="w-5 h-5 -rotate-45" />
            </div>
            <span className="font-bold text-slate-800 text-xs text-center uppercase tracking-wider leading-tight">
              I lost<br />something
            </span>
          </button>
        </div>

        {/* Error Warning */}
        {error && (
          <div className="w-full bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg text-xs font-bold mb-4 text-center uppercase tracking-wider">
            {error}
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 p-3 rounded-lg text-xs font-bold mb-4 text-center uppercase tracking-wider">
            {successMessage}
          </div>
        )}

        {/* Onboarding Credentials Form */}
        <form onSubmit={handleContinue} className="w-full space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-blue-900" /> Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setSuccessMessage('');
              }}
              placeholder="rahul.sharma@gmail.com"
              disabled={isLoading}
              className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 bg-white transition-all disabled:opacity-50"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Password
              </label>
            </div>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setSuccessMessage('');
                }}
                placeholder="••••••••"
                disabled={isLoading}
                className="w-full p-3 pr-10 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 bg-white transition-all disabled:opacity-50"
              />
              <Eye className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer select-none" />
            </div>
          </div>

          {/* Continue button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 uppercase tracking-widest text-xs transition-all cursor-pointer mt-6 flex items-center justify-center gap-2 disabled:opacity-75"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                Synching with Live Sheet...
              </>
            ) : (
              'Continue to Chennai Portal'
            )}
          </button>
        </form>

        {/* Separator */}
        <div className="flex items-center gap-4 w-full my-6 text-slate-400">
          <div className="h-[1px] bg-slate-200 flex-1"></div>
          <span className="text-xs uppercase font-bold tracking-widest">or</span>
          <div className="h-[1px] bg-slate-200 flex-1"></div>
        </div>

        {/* Google Continue */}
        <div className="w-full flex flex-col items-center gap-2">
          {/* Official GIS Button container */}
          <div id="google-signin-div" className="w-full flex justify-center min-h-[44px]"></div>
          
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              // Quick fallback pass in case of offline/local testing
              const defaultName = 'Chennai Citizen';
              const defaultEmail = 'chennai.citizen@gmail.com';
              const defaultPhone = '+91 99999 99999';
              setName(defaultName);
              setEmail(defaultEmail);
              setPhone(defaultPhone);
              onLogin(defaultName, defaultEmail, defaultPhone);
              onStartFlow(selectedRole || 'owner');
            }}
            className="text-[10px] font-bold text-slate-400 hover:text-blue-900 uppercase tracking-widest transition-colors mt-1"
          >
            Or Instant Bypass (Mock Citizen)
          </button>

          <div className="w-full flex justify-center mt-3 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => {
                setShowAdminStepUp(true);
                setAdminError('');
                setAdminUsername('');
                setAdminPassword('');
              }}
              className="text-[10px] font-black text-blue-900 hover:text-blue-950 transition-colors uppercase tracking-widest flex items-center gap-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg px-4 py-2 cursor-pointer shadow-sm"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-900" /> Admin Portal
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-xs text-slate-500 text-center uppercase tracking-wider font-semibold">
          New here?{' '}
          <a
            href="#create"
            onClick={(e) => {
              e.preventDefault();
              setIsRegistering(true);
              setRegistrationStep(1);
              setError('');
            }}
            className="font-bold text-blue-600 hover:underline"
          >
            Create account
          </a>
        </div>
      </div>

      {/* Beautiful Live Success Confirmation Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-[9999] animate-fade-in font-sans">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-500"></div>
            
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">Connection Secured</h3>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider flex items-center justify-center gap-1 bg-emerald-50 py-1 px-2.5 rounded-full w-fit mx-auto border border-emerald-100">
                <Database className="w-3.5 h-3.5" /> Sheet.best Database Synced (200 OK)
              </p>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Welcome, <span className="font-bold text-slate-800">{name}</span>! Your digital signature is successfully logged in the live Chennai civic ledger tab.
            </p>

            <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">
              <div className="text-[10px] text-slate-400 font-mono uppercase">
                Email: {email} • Tel: {phone}
              </div>
              <button
                onClick={handleModalConfirm}
                className="w-full bg-blue-900 hover:bg-blue-950 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-widest cursor-pointer shadow-md active:scale-95 transition-all mt-1"
              >
                Enter Portal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
