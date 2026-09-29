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

const isZalgo = (text: string) => /[\u0300-\u036F\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]{3,}/.test(text);

export default function SettingsForm({ initialProfile, userEmail }: { initialProfile: any, userEmail: string }) {
  const [coverPreview, setCoverPreview] = useState<string | null>(initialProfile?.cover_photo_url || null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialProfile?.avatar_url || null);
  const [coverPosition, setCoverPosition] = useState<number>(initialProfile?.cover_position ?? 50);
  
  const [username, setUsername] = useState(initialProfile?.username || "");
  const [bio, setBio] = useState(initialProfile?.bio || "");
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [coverMsg, setCoverMsg] = useState({ text: "", type: "" });
  const [avatarMsg, setAvatarMsg] = useState({ text: "", type: "" });
  const [infoMsg, setInfoMsg] = useState({ text: "", type: "" });
  const [passwordMsg, setPasswordMsg] = useState({ text: "", type: "" });
  const [emailMsg, setEmailMsg] = useState({ text: "", type: "" });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, type: "cover" | "avatar") => {
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

      const dimensionCheck = await new Promise<{valid: boolean, errorMsg: string}>((resolve) => {
        const img = new window.Image();
        img.onload = () => {
          URL.revokeObjectURL(img.src);
          if (img.width > 2000 || img.height > 2000) {
            resolve({ valid: false, errorMsg: "Dimensions exceed max resolution (2000x2000)." });
          } else if (img.width < 300 || img.height < 300) {
            resolve({ valid: false, errorMsg: "Image must be at least 300x300 pixels." });
          } else {
            resolve({ valid: true, errorMsg: "" });
          }
        };
        img.src = URL.createObjectURL(file);
      });

      if (!dimensionCheck.valid) {
        const msg = { text: dimensionCheck.errorMsg, type: "error" };
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

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    if (!/^[a-zA-Z0-9\s:"'\[\]\{\}\\|><\?,\.\/\-=_+\(\)!@#\$%\^&\*\p{Emoji}\u200D\uFE0F]*$/u.test(text)) return;
    if ([...text].length <= 16) setUsername(text);
  };

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (!/^[a-zA-Z0-9\s:"'\[\]\{\}\\|><\?,\.\/\-=_+\(\)!@#\$%\^&\*\p{Emoji}\u200D\uFE0F]*$/u.test(text)) return;
    if ([...text].length <= 200) setBio(text);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    if (!/^[a-zA-Z0-9\s:"'\[\]\{\}\\|><\?,\.\/\-=_+\(\)!@#\$%\^&\*\p{Emoji}\u200D\uFE0F]*$/u.test(text)) return;
    if ([...text].length <= 100) setNewEmail(text);
  };

  const handleConfirmEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    if (!/^[a-zA-Z0-9\s:"'\[\]\{\}\\|><\?,\.\/\-=_+\(\)!@#\$%\^&\*\p{Emoji}\u200D\uFE0F]*$/u.test(text)) return;
    if ([...text].length <= 100) setConfirmEmail(text);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    if (!/^[a-zA-Z0-9\s:"'\[\]\{\}\\|><\?,\.\/\-=_+\(\)!@#\$%\^&\*\p{Emoji}\u200D\uFE0F]*$/u.test(text)) return;
    if ([...text].length <= 64) setNewPassword(text);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    if (!/^[a-zA-Z0-9\s:"'\[\]\{\}\\|><\?,\.\/\-=_+\(\)!@#\$%\^&\*\p{Emoji}\u200D\uFE0F]*$/u.test(text)) return;
    if ([...text].length <= 64) setConfirmPassword(text);
  };

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

  function handleInfoSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if ([...username].length > 16) return setInfoMsg({ text: "Username must be 16 characters or less.", type: "error" });
    if ([...bio].length > 200) return setInfoMsg({ text: "Signature cannot exceed 200 characters.", type: "error" });

    setInfoMsg({ text: "Updating...", type: "info" });
    const formData = new FormData();
    formData.append("username", username);
    formData.append("bio", bio);

    updateProfileInfo(formData).then((res) => {
      setInfoMsg({ text: res.error || res.success!, type: res.error ? "error" : "success" });
    });
  }

  function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if ([...newPassword].length < 6) return setPasswordMsg({ text: "Password must be at least 6 characters.", type: "error" });
    if ([...newPassword].length > 64) return setPasswordMsg({ text: "Password cannot exceed 64 characters.", type: "error" });
    if (newPassword !== confirmPassword) return setPasswordMsg({ text: "Passwords do not match.", type: "error" });
    
    setPasswordMsg({ text: "Updating...", type: "info" });
    const formData = new FormData();
    formData.append("new_password", newPassword);
    formData.append("password_confirmation", confirmPassword);

    updatePassword(formData).then((res) => {
      setPasswordMsg({ text: res.error || res.success!, type: res.error ? "error" : "success" });
      if (!res.error) {
        setNewPassword("");
        setConfirmPassword("");
      }
    });
  }

  function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if ([...newEmail].length > 100) return setEmailMsg({ text: "Email cannot exceed 100 characters.", type: "error" });
    if (newEmail !== confirmEmail) return setEmailMsg({ text: "Emails do not match.", type: "error" });

    const allowedDomains = ["@gmail.com", "@yahoo.com", "@hotmail.com", "@outlook.com"];
    const isValidDomain = allowedDomains.some(domain => newEmail.toLowerCase().endsWith(domain));
    if (!isValidDomain) {
      return setEmailMsg({ text: "Only @gmail, @yahoo, @hotmail, or @outlook allowed.", type: "error" });
    }
    
    setEmailMsg({ text: "Updating...", type: "info" });
    const formData = new FormData();
    formData.append("new_email", newEmail);
    formData.append("email_confirmation", confirmEmail);

    updateEmail(formData).then((res) => {
      setEmailMsg({ text: res.error || res.success!, type: res.error ? "error" : "success" });
      if (!res.error) {
        setNewEmail("");
        setConfirmEmail("");
      }
    });
  }

  const inputClass = "bg-[#2a2238] border border-transparent text-gray-200 rounded-lg px-3 py-1.5 focus:border-[#735ab0] focus:bg-[#1a1721] focus:outline-none w-full max-w-sm transition-all text-sm";
  const btnClass = "bg-[#735ab0] hover:bg-[#856ec4] text-white font-bold py-1.5 px-6 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 w-32 disabled:opacity-50 disabled:cursor-not-allowed";
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
                <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover transition-all duration-75" style={{ objectPosition: `center ${coverPosition}%` }} />
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
                <input type="range" min="0" max="100" value={coverPosition} onChange={(e) => setCoverPosition(Number(e.target.value))} className="accent-[#735ab0] cursor-pointer" />
              </div>
            )}

            <div className="flex items-center gap-4">
              <label className="text-sm text-gray-400 w-24 text-right">cover file</label>
              <input type="file" name="cover_file" accept="image/*" onChange={(e) => handleImageChange(e, "cover")} className="text-sm text-gray-400 file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:bg-[#735ab0] file:text-white hover:file:bg-[#856ec4] cursor-pointer transition-colors" />
            </div>

            <div className="flex items-center gap-3 mt-1">
              <div className="w-24"></div>
              <button type="submit" className={btnClass}>update <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></button>
              <button type="button" onClick={handleCoverReset} className={resetBtnClass}>reset default <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
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
              <button type="submit" className={btnClass}>update <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></button>
              <button type="button" onClick={handleAvatarReset} className={resetBtnClass}>reset default <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
              {avatarMsg.text && <p className={`text-sm font-medium ${avatarMsg.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>{avatarMsg.text}</p>}
            </div>
          </div>
        </div>
      </form>

      {/* 3. PROFILE INFO */}
      <form onSubmit={handleInfoSubmit}>
        <div className={rowClass}>
          <span className="font-bold text-gray-200 text-lg drop-shadow-md">Profile Details</span>
          <div className="flex flex-col gap-4 w-full max-w-xl">
            <div>
              <div className="flex items-center gap-4">
                <label className="text-sm text-gray-400 w-24 text-right">username</label>
                <input type="text" name="username" value={username} onChange={handleUsernameChange} className={inputClass} placeholder="Max 16 characters" />
              </div>
              <div className="ml-28 mt-1 text-[11px] text-gray-500">{[...username].length}/16 characters</div>
            </div>

            <div>
              <div className="flex items-start gap-4">
                <label className="text-sm text-gray-400 w-24 text-right mt-2">signature</label>
                <textarea name="bio" value={bio} onChange={handleBioChange} rows={4} className={`${inputClass} resize-none`} placeholder="Write something about yourself (max 200 characters)..." />
              </div>
              <div className="ml-28 mt-1 text-[11px] text-gray-500">{[...bio].length}/200 characters</div>
            </div>

            <div className="flex items-center gap-4 mt-1">
              <div className="w-24"></div>
              <button type="submit" disabled={isZalgo(username) || isZalgo(bio)} className={btnClass}>update <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></button>
              {infoMsg.text && <p className={`text-sm font-medium ${infoMsg.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>{infoMsg.text}</p>}
            </div>
          </div>
        </div>
      </form>

      {/* 4. PASSWORD */}
      <form onSubmit={handlePasswordSubmit}>
        <div className={rowClass}>
          <span className="font-bold text-gray-200 text-lg drop-shadow-md">Password</span>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <label className={labelClass}>new password</label>
              <input type="password" name="new_password" required value={newPassword} onChange={handlePasswordChange} className={inputClass} placeholder="6 - 64 characters" />
            </div>
            <div className="flex items-center gap-4">
              <label className={labelClass}>password confirmation</label>
              <input type="password" name="password_confirmation" required value={confirmPassword} onChange={handleConfirmPasswordChange} className={inputClass} placeholder="Confirm new password" />
            </div>
            <div className="ml-40 flex flex-col gap-2 mt-2">
              {passwordMsg.text && <p className={`text-sm font-medium ${passwordMsg.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>{passwordMsg.text}</p>}
              <button type="submit" disabled={isZalgo(newPassword) || isZalgo(confirmPassword)} className={btnClass}>update <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></button>
            </div>
          </div>
        </div>
      </form>

      {/* 5. EMAIL */}
      <form onSubmit={handleEmailSubmit}>
        <div className={`${rowClass} border-b-0 pb-0`}>
          <span className="font-bold text-gray-200 text-lg drop-shadow-md">Email</span>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <label className={labelClass}>current email</label>
              <input type="email" readOnly disabled value={userEmail} className={`${inputClass} opacity-50 cursor-not-allowed`} />
            </div>
            <div>
              <div className="flex items-center gap-4">
                <label className={labelClass}>new email</label>
                <input type="email" name="new_email" required value={newEmail} onChange={handleEmailChange} className={inputClass} placeholder="Trusted domains only" />
              </div>
              <div className="ml-40 mt-1 text-[11px] text-gray-500">{[...newEmail].length}/100 characters</div>
            </div>

            <div>
              <div className="flex items-center gap-4">
                <label className={labelClass}>email confirmation</label>
                <input type="email" name="email_confirmation" required value={confirmEmail} onChange={handleConfirmEmailChange} className={inputClass} placeholder="Confirm new email" />
              </div>
            </div>

            <div className="ml-40 flex flex-col gap-2 mt-2 pb-8">
              {emailMsg.text && <p className={`text-sm font-medium ${emailMsg.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>{emailMsg.text}</p>}
              <button type="submit" disabled={isZalgo(newEmail) || isZalgo(confirmEmail)} className={btnClass}>update <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></button>
            </div>
          </div>
        </div>
      </form>

    </div>
  );
}