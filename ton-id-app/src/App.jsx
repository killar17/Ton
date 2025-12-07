import { TonConnectButton, useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { useState, useCallback } from 'react';
import './App.css';

function App() {
    const [tonConnectUI] = useTonConnectUI();
    const userFriendlyAddress = useTonAddress();
    const [isVerified, setIsVerified] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState('');

    const verifyIdentity = useCallback(async () => {
        if (!tonConnectUI.connected) {
            setVerificationStatus('Please connect your wallet first.');
            return;
        }

        setVerificationStatus('Generating proof request...');

        try {
            const proofPayload = Math.random().toString(36).substring(2, 15);

            const signedProof = await tonConnectUI.getProof({ 
                standard: 'ton-proof-v2', 
                payload: proofPayload 
            });

            setVerificationStatus('Sending proof to server...');

            const response = await fetch('/api/verify-proof', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    address: userFriendlyAddress,
                    proof: signedProof,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setIsVerified(true);
                setVerificationStatus('✅ Identity successfully verified!');
            } else {
                setIsVerified(false);
                setVerificationStatus(`Verification failed: ${data.message}`);
            }

        } catch (e) {
            console.error(e);
            setVerificationStatus(`❌ Verification failed. User rejected or error: ${e.message}`);
        }
    }, [tonConnectUI, userFriendlyAddress]);

    return (
        <div className="App">
            <header className="App-header">
                <h1>TON Identity Linker</h1>
                <TonConnectButton />

                {userFriendlyAddress && (
                    <div className="status-box">
                        <p>Wallet: <code>{userFriendlyAddress}</code></p>

                        {!isVerified ? (
                            <button className="primary-button" onClick={verifyIdentity} disabled={!tonConnectUI.connected}>
                                Verify Ownership (R1)
                            </button>
                        ) : (
                            <button className="success-button" disabled>
                                Identity Verified!
                            </button>
                        )}

                        <p className="status-message">{verificationStatus}</p>

                        {isVerified && (
                            <button className="secondary-button">
                                Continue to Link Management
                            </button>
                        )}
                    </div>
                )}
            </header>
        </div>
    );
}

export default App;
