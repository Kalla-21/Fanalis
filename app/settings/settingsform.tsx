"use client";

import { useState } from "react";
import { 
  updateCoverPhoto, 
  resetCoverPhoto, 
  updateAvatarPhoto, 
  resetAvatarPhoto, 
  updateProfileInfo, 
  updatePassword, 
  updateEmail 
} from "./action";

export default function SettingsForm({ initialProfile, userEmail }: { initialProfile: any, userEmail: string }) {
  const [coverPreview, setCoverPreview] = useState<string | null>(initialProfile?.cover_photo_url || null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialProfile?.avatar_url || null);
  
  const [coverPosition, setCoverPosition] = useState<number>(initialProfile?.cover_position ?? 50);

  const [coverMsg, setCoverMsg] = useState({ text: "", type: "" });
  const [avatarMsg, setAvatarMsg] = useState({ text: "", type: "" });
  const [infoMsg, setInfoMsg] = useState({ text: "", type: "" });
  const [passwordMsg, setPasswordMsg] = useState({ text: "", type: "" });
  const [emailMsg, setEmailMsg] = useState({ text: "", type: "" });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: "cover" | "avatar") => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "image/gif" || file.name.toLowerCase().endsWith('.gif')) {
        const msg = { text: "GIFs are not allowed.", type: "error" };
        if (type === "cover") { setCoverMsg(msg); setCoverPreview(initialProfile?.cover_photo_url || null); }
        else { setAvatarMsg(msg); setAvatarPreview(initialProfile?.avatar_url || null); }
        e.target.value = ""; 
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        const msg = { text: "File must be under 2MB.", type: "error" };
        if (type === "cover") { setCoverMsg(msg); setCoverPreview(initialProfile?.cover_photo_url || null); }
        else { setAvatarMsg(msg); setAvatarPreview(initialProfile?.avatar_url || null); }
        e.target.value = ""; 
        return;
      }

      if (type === "cover") setCoverMsg({ text: "", type: "" });
      else setAvatarMsg({ text: "", type: "" });

      const url = URL.createObjectURL(file);
      if (type === "cover") setCoverPreview(url);
      else setAvatarPreview(url);
    }
  };

  // 🚀 FIRE AND FORGET HANDLERS (No async/await blocking!)
  function handleCoverSubmit(formData: FormData) {
    setCoverMsg({ text: "Uploading in background...", type: "info" });
    formData.append("cover_position", coverPosition.toString());
    
    updateCoverPhoto(formData).then((res) => {
      setCoverMsg({ text: res.error || res.success!, type: res.error ? "error" : "success" });
    });
  }

  function handleCoverReset() {
    setCoverMsg({ text: "Resetting...", type: "info" });
    
    resetCoverPhoto().then((res) => {
      if (!res.error) {
        setCoverPreview(null);
        setCoverPosition(50);
      }
      setCoverMsg({ text: res.error || res.success!, type: res.error ? "error" : "success" });
    });
  }

  function handleAvatarSubmit(formData: FormData) {
    setAvatarMsg({ text: "Uploading in background...", type: "info" });
    
    updateAvatarPhoto(formData).then((res) => {
      setAvatarMsg({ text: res.error || res.success!, type: res.error ? "error" : "success" });
    });
  }

  function handleAvatarReset() {
    setAvatarMsg({ text: "Resetting...", type: "info" });
    
    resetAvatarPhoto().then((res) => {
      if (!res.error) setAvatarPreview(null);
      setAvatarMsg({ text: res.error || res.success!, type: res.error ? "error" : "success" });
    });
  }

  // Text data is fast, but we'll make them non-blocking too just for max snappiness
  function handleInfoSubmit(formData: FormData) {
    setInfoMsg({ text: "Updating...", type: "info" });
    updateProfileInfo(formData).then((res) => {
      setInfoMsg({ text: res.error || res.success!, type: res.error ? "error" : "success" });
    });
  }

  function handlePasswordSubmit(formData: FormData) {
    const newPass = formData.get("new_password");
    const confirmPass = formData.get("password_confirmation");
    if (newPass !== confirmPass) return setPasswordMsg({ text: "Passwords do not match.", type: "error" });
    
    setPasswordMsg({ text: "Updating...", type: "info" });
    updatePassword(formData).then((res) => {
      setPasswordMsg({ text: res.error || res.success!, type: res.error ? "error" : "success" });
    });
  }

  function handleEmailSubmit(formData: FormData) {
    const newEmail = formData.get("new_email");
    const confirmEmail = formData.get("email_confirmation");
    if (newEmail !== confirmEmail) return setEmailMsg({ text: "Emails do not match.", type: "error" });
    
    setEmailMsg({ text: "Updating...", type: "info" });
    updateEmail(formData).then((res) => {
      setEmailMsg({ text: res.error || res.success!, type: res.error ? "error" : "success" });
    });
  }

  const inputClass = "bg-[#2a2238] border border-transparent text-gray-200 rounded-lg px-3 py-1.5 focus:border-[#735ab0] focus:bg-[#1a1721] focus:outline-none w-full max-w-sm transition-all";
  const btnClass = "bg-[#735ab0] hover:bg-[#856ec4] text-white font-bold py-1.5 px-6 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 w-32";
  const resetBtnClass = "bg-[#2a2238] hover:bg-[#3e3254] text-gray-300 font-bold py-1.5 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2";
  const rowClass = "grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 py-6 border-b border-[#2a2238] items-start";
  const labelClass = "text-sm text-gray-400 w-36 text-right pt-2";

  return (
    <div className="flex flex-col pl-5 pr-5">
      
      {/* 1. COVER PHOTO */}
      <form action={handleCoverSubmit}>
        <div className={`${rowClass} pt-5`}>
          <span className="font-bold text-gray-200 text-lg drop-shadow-md">Cover Photo</span>
          <div className="flex flex-col gap-4 w-full max-w-xl">
            
            {coverPreview ? (
              <div className="w-full h-[150px] overflow-hidden rounded-xl shadow-md border border-[#2a2238] relative bg-[#111]">
                <img 
                  src={coverPreview} 
                  alt="Cover Preview" 
                  className="w-full h-full object-cover transition-all duration-75"
                  style={{ objectPosition: `center ${coverPosition}%` }}
                />
              </div>
            ) : (
              <div className="w-full h-[150px] bg-[#2a2238]/50 rounded-xl border border-[#3e3254] flex items-center justify-center text-gray-500 text-sm">No cover photo set</div>
            )}

            {coverPreview && (
              <div className="flex flex-col gap-1.5 bg-[#211c2c] p-3 rounded-xl border border-[#2a2238]">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Reposition vertical view (150px view)</span>
                  <span>{coverPosition}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={coverPosition} 
                  onChange={(e) => setCoverPosition(Number(e.target.value))}
                  className="accent-[#735ab0] cursor-pointer"
                />
              </div>
            )}

            <div className="flex items-center gap-4">
              <label className="text-sm text-gray-400 w-24 text-right">cover file</label>
              <input type="file" name="cover_file" accept="image/*" onChange={(e) => handleImageChange(e, "cover")} className="text-sm text-gray-400 file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:bg-[#735ab0] file:text-white hover:file:bg-[#856ec4] cursor-pointer transition-colors" />
            </div>

            <div className="flex items-center gap-3 mt-1">
              <div className="w-24"></div>
              <button type="submit" className={btnClass}>update <span className="font-sans">✓</span></button>
              <button type="button" onClick={handleCoverReset} className={resetBtnClass}>reset default ✕</button>
              {coverMsg.text && <p className={`text-sm font-medium ${coverMsg.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>{coverMsg.text}</p>}
            </div>
          </div>
        </div>
      </form>

      {/* 2. AVATAR */}
      <form action={handleAvatarSubmit}>
        <div className={rowClass}>
          <span className="font-bold text-gray-200 text-lg drop-shadow-md">Avatar</span>
          <div className="flex flex-col gap-3 w-full max-w-xl">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-24 h-24 object-cover rounded-xl shadow-md border border-[#2a2238]" />
            ) : (
              <div className="w-24 h-24 bg-[#2a2238]/50 rounded-xl border border-[#3e3254] flex items-center justify-center text-gray-500 text-sm">No avatar</div>
            )}
            <div className="flex items-center gap-4">
              <label className="text-sm text-gray-400 w-24 text-right">avatar file</label>
              <input type="file" name="avatar_file" accept="image/*" onChange={(e) => handleImageChange(e, "avatar")} className="text-sm text-gray-400 file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:bg-[#735ab0] file:text-white hover:file:bg-[#856ec4] cursor-pointer transition-colors" />
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="w-24"></div>
              <button type="submit" className={btnClass}>update <span className="font-sans">✓</span></button>
              <button type="button" onClick={handleAvatarReset} className={resetBtnClass}>reset default ✕</button>
              {avatarMsg.text && <p className={`text-sm font-medium ${avatarMsg.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>{avatarMsg.text}</p>}
            </div>
          </div>
        </div>
      </form>

      {/* 3. PROFILE INFO (Username & Bio) */}
      <form action={handleInfoSubmit}>
        <div className={rowClass}>
          <span className="font-bold text-gray-200 text-lg drop-shadow-md">Profile Details</span>
          <div className="flex flex-col gap-4 w-full max-w-xl">
            <div className="flex items-center gap-4">
              <label className="text-sm text-gray-400 w-24 text-right">username</label>
              <input type="text" name="username" defaultValue={initialProfile?.username || ""} className={inputClass} />
            </div>
            <div className="flex items-start gap-4">
              <label className="text-sm text-gray-400 w-24 text-right mt-2">signature</label>
              <textarea name="bio" defaultValue={initialProfile?.bio || ""} rows={4} className={`${inputClass} resize-none`} placeholder="Write something about yourself..." />
            </div>
            <div className="flex items-center gap-4 mt-1">
              <div className="w-24"></div>
              <button type="submit" className={btnClass}>update <span className="font-sans">✓</span></button>
              {infoMsg.text && <p className={`text-sm font-medium ${infoMsg.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>{infoMsg.text}</p>}
            </div>
          </div>
        </div>
      </form>

      {/* PASSWORD */}
      <form action={handlePasswordSubmit}>
        <div className={rowClass}>
          <span className="font-bold text-gray-200 text-lg drop-shadow-md">Password</span>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <label className={labelClass}>new password</label>
              <input type="password" name="new_password" required className={inputClass} />
            </div>
            <div className="flex items-center gap-4">
              <label className={labelClass}>password confirmation</label>
              <input type="password" name="password_confirmation" required className={inputClass} />
            </div>
            <div className="ml-40 flex flex-col gap-2 mt-2">
              {passwordMsg.text && <p className={`text-sm font-medium ${passwordMsg.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>{passwordMsg.text}</p>}
              <button type="submit" className={btnClass}>update <span className="font-sans">✓</span></button>
            </div>
          </div>
        </div>
      </form>

      {/* EMAIL */}
      <form action={handleEmailSubmit}>
        <div className={`${rowClass} border-b-0 pb-0`}>
          <span className="font-bold text-gray-200 text-lg drop-shadow-md">Email</span>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <label className={labelClass}>current email</label>
              <input type="email" readOnly disabled value={userEmail} className={`${inputClass} opacity-50 cursor-not-allowed`} />
            </div>
            <div className="flex items-center gap-4">
              <label className={labelClass}>new email</label>
              <input type="email" name="new_email" required className={inputClass} />
            </div>
            <div className="flex items-center gap-4">
              <label className={labelClass}>email confirmation</label>
              <input type="email" name="email_confirmation" required className={inputClass} />
            </div>
            <div className="ml-40 flex flex-col gap-2 mt-2 pb-8">
              {emailMsg.text && <p className={`text-sm font-medium ${emailMsg.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>{emailMsg.text}</p>}
              <button type="submit" className={btnClass}>update <span className="font-sans">✓</span></button>
            </div>
          </div>
        </div>
      </form>

    </div>
  );
}