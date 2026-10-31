import React, { useState } from 'react';
import { X, Check, Lock, CheckCircle2, KeyRound } from 'lucide-react';
import { COVER_OPTIONS as COVERS, type Notebook, type PaperStyle } from '../../types';
import { useNotebookStore } from '../../stores/notebookStore';

interface EditNotebookModalProps {
  notebook: Notebook;
  onClose: () => void;
}

export default function EditNotebookModal({ notebook, onClose }: EditNotebookModalProps) {
  const updateNotebook = useNotebookStore(s => s.updateNotebook);

  const localPin = typeof window !== 'undefined' ? localStorage.getItem(`notely_pin_${notebook.id}`) : null;
  const initialPinCode = notebook.pinCode || localPin || '';
  const initialIsLocked = Boolean(notebook.isLocked || (initialPinCode && initialPinCode.length === 4));

  const [title, setTitle] = useState(notebook.title);
  const [category, setCategory] = useState(notebook.category || notebook.subject || 'General');
  const [description, setDescription] = useState(notebook.description || '');
  const [selectedColor, setSelectedColor] = useState(notebook.coverColor);
  const [paperStyle] = useState<PaperStyle>(notebook.paperStyle || 'ruled');

  // Lock states
  const [isLocked, setIsLocked] = useState(initialIsLocked);
  const [pinCode, setPinCode] = useState(initialPinCode);

  // Turn-off verification states
  const [showTurnOffVerify, setShowTurnOffVerify] = useState(false);
  const [turnOffPinInput, setTurnOffPinInput] = useState('');
  const [turnOffError, setTurnOffError] = useState('');

  // Change PIN states
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [currentPinForChange, setCurrentPinForChange] = useState('');
  const [isCurrentPinVerifiedForChange, setIsCurrentPinVerifiedForChange] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [changePinError, setChangePinError] = useState('');

  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Toggle button handler
  const handleToggleClick = () => {
    setError('');
    // If currently locked and user wants to turn it OFF
    if (isLocked) {
      const activePin = pinCode || initialPinCode;
      // If the notebook has a PIN saved, require current PIN to turn OFF
      if (activePin && activePin.length === 4) {
        setShowTurnOffVerify(true);
        setTurnOffPinInput('');
        setTurnOffError('');
      } else {
        // Just toggled on during this session without being saved
        setIsLocked(false);
        setPinCode('');
      }
    } else {
      // Turning lock ON
      setIsLocked(true);
      setShowTurnOffVerify(false);
      setIsChangingPin(false);
    }
  };

  // Confirm turn off with PIN
  const handleConfirmTurnOff = () => {
    const activePin = pinCode || initialPinCode;
    if (turnOffPinInput === activePin) {
      setIsLocked(false);
      setPinCode('');
      setShowTurnOffVerify(false);
      setTurnOffPinInput('');
      setTurnOffError('');
      setIsChangingPin(false);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`notely_pin_${notebook.id}`);
      }
    } else {
      setTurnOffError('Incorrect PIN. Please enter the current PIN to disable.');
    }
  };

  // Verify current PIN before allowing PIN change
  const handleVerifyCurrentForChange = () => {
    const activePin = pinCode || initialPinCode;
    if (currentPinForChange === activePin) {
      setIsCurrentPinVerifiedForChange(true);
      setChangePinError('');
    } else {
      setChangePinError('Incorrect current PIN');
    }
  };

  const handleSaveNewPin = () => {
    if (newPinInput.length !== 4) {
      setChangePinError('New PIN must be 4 digits');
      return;
    }
    setPinCode(newPinInput);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`notely_pin_${notebook.id}`, newPinInput);
    }
    setIsChangingPin(false);
    setCurrentPinForChange('');
    setNewPinInput('');
    setIsCurrentPinVerifiedForChange(false);
    setChangePinError('');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      setError('Notebook title is required');
      return;
    }

    const finalPin = isLocked ? (pinCode || initialPinCode) : undefined;
    if (isLocked) {
      if (!finalPin || finalPin.length !== 4) {
        setError('Please set a 4-digit PIN for protection');
        return;
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(`notely_pin_${notebook.id}`, finalPin);
      }
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`notely_pin_${notebook.id}`);
      }
    }

    setIsSaving(true);
    await updateNotebook(notebook.id, {
      title: title.trim(),
      category: category.trim(),
      subject: category.trim(),
      description: description.trim(),
      coverColor: selectedColor,
      paperStyle,
      isLocked,
      pinCode: finalPin,
    });
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 animate-pop-in overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-stone-50/70 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 rounded-full shadow-xs" style={{ backgroundColor: selectedColor }} />
            <h2 className="font-bold text-gray-800 text-base">Edit Notebook</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-200/60 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 font-medium">
              {error}
            </p>
          )}

          {/* Cover Color Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Cover Color
            </label>
            <div className="grid grid-cols-6 gap-2">
              {COVERS.map(opt => (
                <button
                  key={opt.color}
                  type="button"
                  onClick={() => setSelectedColor(opt.color)}
                  className={`h-7.5 rounded-lg transition-all relative flex items-center justify-center shadow-xs cursor-pointer ${
                    selectedColor === opt.color
                      ? 'ring-2 ring-offset-2 ring-gray-900 scale-105'
                      : 'hover:scale-105 opacity-90'
                  }`}
                  style={{ backgroundColor: opt.color }}
                  title={opt.label}
                >
                  {selectedColor === opt.color && (
                    <Check size={13} className="text-white drop-shadow-md stroke-[3]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Notebook Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => { setTitle(e.target.value); setError(''); }}
              placeholder="Enter notebook title (e.g. Daily Journal, Work Strategy)..."
              required
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:border-stone-800 focus:ring-2 focus:ring-stone-100 outline-none text-xs text-stone-900 font-medium transition-all"
            />
          </div>

          {/* Category / Tag */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Category / Tag
            </label>
            <input
              type="text"
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="Enter category or tag (e.g. Work, Personal, Journal)..."
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:border-stone-800 focus:ring-2 focus:ring-stone-100 outline-none text-xs text-stone-700 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief summary or purpose of this notebook..."
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:border-stone-800 focus:ring-2 focus:ring-stone-100 outline-none text-xs text-stone-700 transition-all"
            />
          </div>

          {/* PIN Protection Card */}
          <div className="p-3.5 rounded-2xl border border-stone-200/90 bg-stone-50/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isLocked ? 'bg-amber-100 text-amber-700' : 'bg-stone-200/70 text-stone-500'}`}>
                  <Lock size={15} />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-800">PIN Protection</p>
                  <p className="text-[11px] text-stone-500">
                    {isLocked ? 'Notebook is locked with a 4-digit PIN' : 'Lock notebook with a 4-digit PIN'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleClick}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                  isLocked ? 'bg-stone-900' : 'bg-stone-300'
                }`}
                title={isLocked ? 'Click to turn off PIN lock' : 'Click to turn on PIN lock'}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    isLocked ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Prompt for PIN to Turn Off */}
            {showTurnOffVerify && (
              <div className="mt-3 pt-3 border-t border-stone-200/70 animate-fade-in space-y-2.5 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/50">
                <div className="flex items-center gap-1.5 text-xs text-stone-800 font-semibold">
                  <KeyRound size={13} className="text-amber-600" />
                  <span>Enter Current PIN to Turn Off</span>
                </div>
                <p className="text-[11px] text-stone-500">
                  Enter your 4-digit PIN to disable PIN protection on this notebook.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={turnOffPinInput}
                    onChange={(e) => {
                      setTurnOffPinInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                      setTurnOffError('');
                    }}
                    placeholder="••••"
                    className="w-24 tracking-widest text-center px-3 py-1.5 text-xs font-mono font-bold rounded-xl border border-stone-300 bg-white focus:border-stone-900 outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleConfirmTurnOff}
                    disabled={turnOffPinInput.length !== 4}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-stone-900 text-amber-200 hover:bg-stone-800 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    Confirm Turn Off
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTurnOffVerify(false);
                      setTurnOffPinInput('');
                      setTurnOffError('');
                    }}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-xl text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                {turnOffError && (
                  <p className="text-[11px] text-red-600 font-medium">{turnOffError}</p>
                )}
              </div>
            )}

            {/* When Lock is ON and NOT prompting for Turn Off */}
            {isLocked && !showTurnOffVerify && (
              <div className="mt-3 pt-3 border-t border-stone-200/60 animate-fade-in space-y-2.5">
                {/* If already has saved PIN */}
                {(pinCode || initialPinCode) && (pinCode || initialPinCode).length === 4 ? (
                  !isChangingPin ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 size={13} /> PIN protection enabled
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsChangingPin(true);
                          setCurrentPinForChange('');
                          setNewPinInput('');
                          setIsCurrentPinVerifiedForChange(false);
                          setChangePinError('');
                        }}
                        className="text-xs text-stone-600 hover:text-stone-900 font-medium underline cursor-pointer"
                      >
                        Change PIN
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 bg-stone-100/70 p-2.5 rounded-xl border border-stone-200/70">
                      {!isCurrentPinVerifiedForChange ? (
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-semibold text-stone-700">
                            Enter Current PIN:
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="password"
                              maxLength={4}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={currentPinForChange}
                              onChange={(e) => {
                                setCurrentPinForChange(e.target.value.replace(/\D/g, '').slice(0, 4));
                                setChangePinError('');
                              }}
                              placeholder="••••"
                              className="w-24 tracking-widest text-center px-3 py-1.5 text-xs font-mono font-bold rounded-xl border border-stone-300 bg-white focus:border-stone-900 outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={handleVerifyCurrentForChange}
                              disabled={currentPinForChange.length !== 4}
                              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-stone-900 text-amber-200 hover:bg-stone-800 disabled:opacity-50 cursor-pointer"
                            >
                              Verify
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsChangingPin(false)}
                              className="text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-semibold text-stone-700">
                            Enter New 4-Digit PIN:
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="password"
                              maxLength={4}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={newPinInput}
                              onChange={(e) => {
                                setNewPinInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                                setChangePinError('');
                              }}
                              placeholder="••••"
                              className="w-24 tracking-widest text-center px-3 py-1.5 text-xs font-mono font-bold rounded-xl border border-stone-300 bg-white focus:border-stone-900 outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={handleSaveNewPin}
                              disabled={newPinInput.length !== 4}
                              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 cursor-pointer"
                            >
                              Update PIN
                            </button>
                          </div>
                        </div>
                      )}
                      {changePinError && (
                        <p className="text-[11px] text-red-600 font-medium">{changePinError}</p>
                      )}
                    </div>
                  )
                ) : (
                  /* Setting initial PIN */
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-stone-700">
                      Set 4-Digit PIN:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        maxLength={4}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={pinCode}
                        onChange={(e) => {
                          setPinCode(e.target.value.replace(/\D/g, '').slice(0, 4));
                          setError('');
                        }}
                        placeholder="••••"
                        className="w-24 tracking-widest text-center px-3 py-1.5 text-xs font-mono font-bold rounded-xl border border-stone-300 bg-white focus:border-stone-900 outline-none"
                        autoFocus
                      />
                      <span className="text-[11px] text-stone-400">
                        {pinCode.length}/4 digits
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sticky Fixed Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-stone-50/50 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 py-2.5 rounded-xl bg-stone-900 text-amber-200 text-xs font-semibold hover:bg-stone-800 transition-colors disabled:opacity-60 cursor-pointer shadow-sm"
          >
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
