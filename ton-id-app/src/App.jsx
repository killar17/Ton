import { TonConnectButton, useTonAddress, useTonWallet } from '@tonconnect/ui-react';
import './App.css';

function App() {
  const wallet = useTonWallet();
  const userFriendlyAddress = useTonAddress();

  return (
    <div className="App">
      <header className="App-header">
        <h1>TON Identity Linker</h1>

        <TonConnectButton />

        {wallet ? (
          <div className="status-box connected">
            <h2>✅ Wallet Connected!</h2>
            <p>
              **Your Decentralized ID (DID):**<br />
              <code className="address-code">{userFriendlyAddress}</code>
            </p>
            <p>
              This address is your unique digital fingerprint on TON.
            </p>

            <button className="primary-button">Manage My Links</button>

          </div>
        ) : (
          <div className="status-box disconnected">
            <h2>Please Connect Your Wallet</h2>
            <p>Connect your Telegram Wallet or Tonkeeper to prove ownership and start building your decentralized Link-in-Bio profile.</p>
          </div>
        )}

      </header>
    </div>
  );
}

export default App;
