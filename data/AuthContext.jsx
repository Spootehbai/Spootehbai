import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function validatePassword(password) {
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 128
  ) {
    throw new Error("Password must be 8 to 128 characters.");
  }
}

function createLocalId(email) {
  return `local-${encodeURIComponent(email)}`;
}

export function AuthProvider({ children }) {
  const [accounts, setAccounts] = useState([]);
  const [account, setAccount] = useState(null);

  async function registerAccount({ username, email, password }) {
    const cleanUsername = username.trim();
    const cleanEmail = normalizeEmail(email);
    if (!cleanUsername || !cleanEmail || !password) {
      throw new Error("Complete every field to create your account.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new Error("Enter a valid email address.");
    }
    validatePassword(password);
    if (accounts.some((savedAccount) => savedAccount.email === cleanEmail)) {
      throw new Error("An account already uses this email on this device.");
    }

    const newAccount = {
      uid: createLocalId(cleanEmail),
      email: cleanEmail,
      displayName: cleanUsername,
      password,
    };
    const publicAccount = {
      uid: newAccount.uid,
      email: newAccount.email,
      displayName: newAccount.displayName,
    };

    setAccounts((savedAccounts) => [...savedAccounts, newAccount]);
    setAccount(publicAccount);
    return publicAccount;
  }

  async function loginAccount(email, password) {
    const cleanEmail = normalizeEmail(email);
    const savedAccount = accounts.find(
      (candidate) =>
        candidate.email === cleanEmail && candidate.password === password
    );
    if (!savedAccount) {
      throw new Error("Email or password is incorrect.");
    }

    const publicAccount = {
      uid: savedAccount.uid,
      email: savedAccount.email,
      displayName: savedAccount.displayName,
    };
    setAccount(publicAccount);
    return publicAccount;
  }

  function logoutAccount() {
    setAccount(null);
  }

  function updateCurrentAccountDisplayName(displayName) {
    const cleanName = displayName.trim();
    if (!account || !cleanName) {
      throw new Error("A signed-in account and display name are required.");
    }

    const updatedAccount = { ...account, displayName: cleanName };
    setAccounts((savedAccounts) =>
      savedAccounts.map((savedAccount) =>
        savedAccount.uid === account.uid
          ? { ...savedAccount, displayName: cleanName }
          : savedAccount
      )
    );
    setAccount(updatedAccount);
    return updatedAccount;
  }

  function changePassword(currentPassword, newPassword) {
    validatePassword(newPassword);
    const savedAccount = accounts.find(
      (candidate) => candidate.uid === account?.uid
    );
    if (!savedAccount) {
      throw new Error("Log in before changing your password.");
    }
    if (savedAccount.password !== currentPassword) {
      throw new Error("Current password is incorrect.");
    }
    if (currentPassword === newPassword) {
      throw new Error("Choose a password different from your current one.");
    }

    setAccounts((currentAccounts) =>
      currentAccounts.map((candidate) =>
        candidate.uid === account.uid
          ? { ...candidate, password: newPassword }
          : candidate
      )
    );
  }

  function resetPassword(email, newPassword) {
    const cleanEmail = normalizeEmail(email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new Error("Enter a valid email address.");
    }
    validatePassword(newPassword);
    if (!accounts.some((candidate) => candidate.email === cleanEmail)) {
      throw new Error("No active local account uses this email.");
    }

    setAccounts((currentAccounts) =>
      currentAccounts.map((candidate) =>
        candidate.email === cleanEmail
          ? { ...candidate, password: newPassword }
          : candidate
      )
    );
  }

  function verifyCurrentPassword(password) {
    const savedAccount = accounts.find(
      (candidate) => candidate.uid === account?.uid
    );
    if (!savedAccount) {
      throw new Error("Log in before deleting your account.");
    }
    if (savedAccount.password !== password) {
      throw new Error("Current password is incorrect.");
    }
  }

  function deleteAccount(password) {
    verifyCurrentPassword(password);
    setAccounts((currentAccounts) =>
      currentAccounts.filter((candidate) => candidate.uid !== account.uid)
    );
    setAccount(null);
  }

  return (
    <AuthContext.Provider
      value={{
        account,
        registerAccount,
        loginAccount,
        logoutAccount,
        updateCurrentAccountDisplayName,
        changePassword,
        resetPassword,
        verifyCurrentPassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
