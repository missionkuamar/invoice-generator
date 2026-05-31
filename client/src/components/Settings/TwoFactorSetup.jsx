import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setup2FA, enable2FA, disable2FA } from '../../store/slices/authSlice';
import QRCode from 'qrcode.react';
import toast from 'react-hot-toast';
import { FiShield, FiCopy, FiCheck } from 'react-icons/fi';

export default function TwoFactorSetup() {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  const [setupData, setSetupData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSetup = async () => {
    try {
      const data = await dispatch(setup2FA()).unwrap();
      setSetupData(data);
    } catch (error) {
      toast.error(error.message || 'Failed to setup 2FA');
    }
  };

  const handleEnable = async () => {
    if (!verificationCode) {
      toast.error('Please enter verification code');
      return;
    }
    
    try {
      const result = await dispatch(enable2FA({ twoFactorCode: verificationCode })).unwrap();
      setBackupCodes(result.backupCodes);
      setShowBackupCodes(true);
      toast.success('2FA enabled successfully!');
    } catch (error) {
      toast.error(error.message || 'Invalid code');
    }
  };

  const handleDisable = async () => {
    const code = prompt('Enter your 2FA code to disable:');
    if (!code) return;
    
    try {
      await dispatch(disable2FA({ twoFactorCode: code })).unwrap();
      setSetupData(null);
      setBackupCodes([]);
      setShowBackupCodes(false);
      toast.success('2FA disabled successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to disable 2FA');
    }
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Backup codes copied to clipboard');
  };

  if (userInfo?.twoFactorEnabled) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FiShield className="text-green-600" />
              Two-Factor Authentication
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              2FA is currently <span className="text-green-600 font-medium">ENABLED</span>
            </p>
          </div>
          <button
            onClick={handleDisable}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Disable 2FA
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Your account is protected with two-factor authentication.
        </p>
      </div>
    );
  }

  if (showBackupCodes) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Backup Codes</h3>
        <p className="text-sm text-gray-600 mb-4">
          Save these backup codes in a secure place. You can use them to access your account
          if you lose your authenticator device.
        </p>
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map((code, index) => (
              <code key={index} className="font-mono text-sm">{code}</code>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={copyBackupCodes}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            {copied ? <FiCheck /> : <FiCopy />}
            {copied ? 'Copied!' : 'Copy Codes'}
          </button>
          <button
            onClick={() => setShowBackupCodes(false)}
            className="px-4 py-2 btn-secondary"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  if (setupData) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Setup Two-Factor Authentication</h3>
        
        <div className="text-center mb-6">
          <div className="inline-block p-4 bg-white rounded-lg border">
            <QRCode value={setupData.otpauthUrl} size={200} />
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Scan this QR code with Google Authenticator or any TOTP app
          </p>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Or enter this secret key manually:</p>
          <code className="block bg-gray-100 p-2 rounded text-sm font-mono text-center">
            {setupData.secret}
          </code>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Verification Code</label>
          <input
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Enter 6-digit code from app"
            className="input-field mb-4"
            maxLength="6"
          />
          <button
            onClick={handleEnable}
            className="w-full btn-primary"
          >
            Verify & Enable 2FA
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FiShield />
            Two-Factor Authentication
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Add an extra layer of security to your account
          </p>
        </div>
        <button
          onClick={handleSetup}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Setup 2FA
        </button>
      </div>
      <p className="text-sm text-gray-600">
        When you enable 2FA, you'll need to enter a verification code from your
        authenticator app every time you log in.
      </p>
    </div>
  );
}