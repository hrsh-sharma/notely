import React, { useState, useEffect, useRef } from 'react';
import { Lock, X, Delete, KeyRound, Loader2, Trash2 } from 'lucide-react';
import type { Notebook } from '../../types';
import { useAuthStore } from '../../stores/authStore';

interface PinUnlockModalProps {
  notebook: Notebook;
  titleAction?: string; // e.g. "open", "edit", "delete"
  onClose: () => void;
  onSuccess: () => void;
}

export default function PinUnlockModal({
  notebook,
  titleAction = 'open',
  onClose,
  onSuccess,
}: PinUnlockModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [mode, setMode] = useState<'pin' | 'password'>('pin');
  const [accountPassword, setAccountPassword] = useState('');
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const verifyPassword = useAuthStore(s => s.verifyPassword);

  useEffect(() => {
    if (mode === 'pin') {
      inputRef.current?.focus();
    }
  }, [mode]);

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const verifyPin = (candidatePin: string) => {
    const validPin = notebook.pinCode || (typeof window !== 'undefined' ? localStorage.getItem(`notely_pin_${notebook.id}`) : null);
    if (candidatePin === validPin) {
      onSuccess();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setPin(''), 600);
    }
  };

  const handleVerifyPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!accountPassword.trim()) return;
    setIsVerifyingPassword(true);
    setPasswordError('');
    const res = await verifyPassword(accountPassword);
    setIsVerifyingPassword(false);
    if (res.error) {
      setPasswordError(res.error);
    } else {
      onSuccess();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mode === 'pin') {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        onClose();
      }
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`bg-[#FEFDF9] rounded-3xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-pop-in border border-stone-200 select-none ${
          shake ? 'animate-shake' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* Hidden input for software keyboards / native key capturing */}
        {mode === 'pin' && (
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 4);
              setPin(val);
              setError(false);
              if (val.length === 4) verifyPin(val);
            }}
            className="opacity-0 absolute -z-10 w-0 h-0"
          />
        )}

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full shadow-xs"
              style={{ backgroundColor: notebook.coverColor }}
            />
            <span className="text-xs font-semibold text-stone-500 truncate max-w-[180px]">
              {notebook.title}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Lock / Delete Icon & Title */}
        <div className="text-center pt-2 pb-5">
          <div
            className={`w-13 h-13 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs border ${
              titleAction === 'delete'
                ? 'bg-red-50 text-red-600 border-red-200/70'
                : 'bg-amber-50 text-amber-600 border-amber-200/70'
            }`}
          >
            {titleAction === 'delete' ? <Trash2 size={22} /> : <Lock size={22} />}
          </div>
          <h3 className="font-bold text-stone-900 text-base">
            {titleAction === 'delete' ? 'Enter PIN to Delete Notebook' : 'Enter PIN to Open Notebook'}
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            {titleAction === 'delete'
              ? 'This locked notebook requires your 4-digit PIN to delete'
              : 'This notebook is protected with a 4-digit passcode'}
          </p>
        </div>

        {mode === 'pin' ? (
          <>
            {/* 4-Digit Display Indicator */}
            <div className="flex justify-center items-center gap-3.5 mb-5">
              {[0, 1, 2, 3].map((index) => {
                const isFilled = index < pin.length;
                return (
                  <div
                    key={index}
                    className={`w-11 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-lg transition-all duration-150 border ${
                      error
                        ? 'border-red-400 bg-red-50 text-red-600'
                        : isFilled
                        ? 'border-stone-800 bg-stone-900 text-amber-200 shadow-sm scale-105'
                        : 'border-stone-200 bg-white text-stone-300'
                    }`}
                  >
                    {isFilled ? '•' : ''}
                  </div>
                );
              })}
            </div>

            {/* Error message */}
            <div className="h-5 text-center mb-2">
              {error && (
                <p className="text-xs text-red-600 font-semibold animate-fade-in">
                  Incorrect PIN. Try again.
                </p>
              )}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigit(digit)}
                  className="h-11 rounded-xl bg-white hover:bg-stone-100 border border-stone-200/80 text-stone-800 font-semibold text-base shadow-xs active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={onClose}
                className="h-11 rounded-xl text-stone-400 hover:text-stone-700 text-xs font-medium transition-colors flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDigit('0')}
                className="h-11 rounded-xl bg-white hover:bg-stone-100 border border-stone-200/80 text-stone-800 font-semibold text-base shadow-xs active:scale-95 transition-all flex items-center justify-center cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="h-11 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors flex items-center justify-center"
                title="Backspace"
              >
                <Delete size={18} />
              </button>
            </div>

            {/* Unlock with Profile Password fallback */}
            <div className="text-center mt-4 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setMode('password')}
                className="text-xs text-stone-500 hover:text-stone-800 underline transition-colors cursor-pointer"
              >
                Unlock with Profile Password instead
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleVerifyPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <KeyRound size={13} className="text-amber-600" />
                <span>Profile Password</span>
              </label>
              <input
                type="password"
                value={accountPassword}
                onChange={(e) => {
                  setAccountPassword(e.target.value);
                  setPasswordError('');
                }}
                placeholder="Enter your account password"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-stone-300 bg-white focus:border-stone-800 outline-none"
                autoFocus
              />
              {passwordError && (
                <p className="text-xs text-red-600 mt-1">{passwordError}</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode('pin');
                  setPasswordError('');
                }}
                className="flex-1 py-2 rounded-xl border border-stone-200 text-xs font-medium text-stone-600 hover:bg-stone-50"
              >
                Back to PIN
              </button>
              <button
                type="submit"
                disabled={isVerifyingPassword || !accountPassword.trim()}
                className="flex-1 py-2 rounded-xl bg-stone-900 text-amber-200 text-xs font-semibold hover:bg-stone-800 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isVerifyingPassword ? <Loader2 size={13} className="animate-spin" /> : null}
                <span>{isVerifyingPassword ? 'Verifying…' : 'Unlock'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
