import { useEffect, useState } from "react";
import "./App.css";


function showToast(message, type = "success") {
  const existing = document.querySelector(".app-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `app-toast app-toast-${type}`;

  const icon = document.createElement("span");
  icon.className = "app-toast-icon";
  icon.textContent =
    type === "error" ? "!" : type === "warning" ? "!" : "✓";

  const content = document.createElement("div");
  content.className = "app-toast-content";

  const title = document.createElement("strong");
  title.textContent =
    type === "error"
      ? "Something went wrong"
      : type === "warning"
        ? "Check this"
        : "Success";

  const text = document.createElement("span");
  text.textContent = message;

  content.appendChild(title);
  content.appendChild(text);
  toast.appendChild(icon);
  toast.appendChild(content);

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

function App() {
  // Keep all existing setPage(...) calls working and connect them to browser history.
  const [page, setPageState] = useState("dashboard");

  const setPage = (nextPage) => {
    setPageState(nextPage);
    window.history.pushState(
      { silelanPage: nextPage },
      "",
      window.location.href
    );
  };

  useEffect(() => {
    window.history.replaceState(
      { silelanPage: "dashboard" },
      "",
      window.location.href
    );

    const handleBrowserBack = (event) => {
      const previousPage = event.state?.silelanPage || "dashboard";
      setPageState(previousPage);
    };

    window.addEventListener("popstate", handleBrowserBack);

    return () => {
      window.removeEventListener("popstate", handleBrowserBack);
    };
  }, []);

  // =========================
  // OWNER AUTHENTICATION
  // =========================
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const API_BASE = "https://silelan-backend.onrender.com";
  const TOKEN_KEY = "silelan_owner_token";

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setIsAuthenticated(false);
    setLoginPassword("");
    setCollectedUnlocked(false);
    setCollectedPassword("");
    setShowCollectedPassword(false);
    setPage("dashboard");
    setMembers([]);
    setTodayAttendance([]);
    setCurrentlyInside([]);
    setSelectedMember(null);
    showToast("Logged out successfully.", "success");
  };

  const apiFetch = async (url, options = {}) => {
    const token = localStorage.getItem(TOKEN_KEY);

    const headers = {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      setIsAuthenticated(false);
      setLoginPassword("");
    }

    return response;
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!loginEmail.trim() || !loginPassword) {
      showToast("Please enter your email and password.", "warning");
      return;
    }

    setLoginLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid email or password.");
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      setIsAuthenticated(true);
      setLoginPassword("");
      setPage("dashboard");
      showToast("Welcome to SILELAN Owner Console.", "success");
    } catch (error) {
      console.error("Login error:", error);
      showToast(error.message || "Login failed.", "error");
    } finally {
      setLoginLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      setCheckingAuth(false);
      return;
    }

    fetch(`${API_BASE}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          localStorage.removeItem(TOKEN_KEY);
          setIsAuthenticated(false);
          return;
        }

        setIsAuthenticated(true);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setIsAuthenticated(false);
      })
      .finally(() => {
        setCheckingAuth(false);
      });
  }, []);

  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);

  const [collectMember, setCollectMember] = useState(null);
  const [collectAmount, setCollectAmount] = useState("");
  const [collectPaymentMethod, setCollectPaymentMethod] = useState("Cash");

  const [renewMember, setRenewMember] = useState(null);
  const [renewPlan, setRenewPlan] = useState("");
  const [renewAmount, setRenewAmount] = useState("");
  const [renewPaymentMethod, setRenewPaymentMethod] = useState("Cash");
  const [renewLoading, setRenewLoading] = useState(false);

  const [deleteMemberLoading, setDeleteMemberLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // =========================
  // EDIT MEMBER
  // =========================

  const [editMember, setEditMember] = useState(null);
  const [editMemberLoading, setEditMemberLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    email: "",
    dob: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    dob: "",
    joiningDate: new Date().toISOString().split("T")[0],
    amountPaid: "",
    paymentMethod: "Cash",
  });

  const [membership, setMembership] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // =========================
  // PROTECTED TOTAL COLLECTED
  // =========================
  const [showCollectedPassword, setShowCollectedPassword] = useState(false);
  const [collectedPassword, setCollectedPassword] = useState("");
  const [collectedUnlocked, setCollectedUnlocked] = useState(false);
  const [collectedPasswordLoading, setCollectedPasswordLoading] = useState(false);

  // =========================
  // FAKE FINGERPRINT
  // =========================
  // Temporary test system until the real biometric
  // scanner/API is connected.
  const [fingerprintId, setFingerprintId] = useState("");
  const [fingerprintLoading, setFingerprintLoading] = useState(false);

  // =========================
  // GATE SCAN TEST
  // =========================
  // Temporary test input until the real vendor biometric scanner/API
  // is connected. Enter a registered fingerprintId such as FP001.
  const [scanFingerprintId, setScanFingerprintId] = useState("");
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  // =========================
  // ATTENDANCE
  // =========================

  const [todayAttendance, setTodayAttendance] = useState([]);
  const [currentlyInside, setCurrentlyInside] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [memberAttendance, setMemberAttendance] = useState([]);
  const [memberAttendanceLoading, setMemberAttendanceLoading] = useState(false);

  const membershipPrices = {
    "1 Month": 1199,
    "3 Months": 2999,
    "6 Months": 5499,
    "1 Year": 8999,
  };

  // =========================
  // MEMBER STATUS
  // =========================

  const getStatusInfo = (member) => {
    if (member.paymentStatus === "EXPIRED") {
      return { label: "EXPIRED", className: "status-expired" };
    }

    if (member.paymentStatus === "PAYMENT DUE") {
      return { label: "PAYMENT DUE", className: "status-due" };
    }

    return { label: "ACTIVE", className: "status-paid" };
  };

  // =========================
  // LOAD MEMBERS
  // =========================

  const loadMembers = () => {
    apiFetch(`${API_BASE}/api/members`)
      .then((response) => response.json())
      .then((data) => setMembers(data))
      .catch((error) =>
        console.error("Error loading members:", error)
      );
  };

  const loadAttendance = async () => {
    try {
      setAttendanceLoading(true);

      const [todayResponse, insideResponse] =
        await Promise.all([
          apiFetch(`${API_BASE}/api/attendance/today`),
          apiFetch(`${API_BASE}/api/attendance/inside`),
        ]);

      const todayData = await todayResponse.json();
      const insideData = await insideResponse.json();

      if (todayResponse.ok) {
        setTodayAttendance(todayData);
      }

      if (insideResponse.ok) {
        setCurrentlyInside(insideData);
      }
    } catch (error) {
      console.error("Error loading attendance:", error);
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    loadMembers();
    loadAttendance();

    const interval = setInterval(() => {
      loadMembers();
      loadAttendance();
    }, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const loadMemberAttendance = async (memberId) => {
    if (!memberId) {
      setMemberAttendance([]);
      return;
    }

    try {
      setMemberAttendanceLoading(true);

      const response = await apiFetch(
        `${API_BASE}/api/attendance/member/${memberId}`
      );

      const data = await response.json();

      if (response.ok) {
        setMemberAttendance(data);
      } else {
        setMemberAttendance([]);
      }
    } catch (error) {
      console.error("Error loading member attendance:", error);
      setMemberAttendance([]);
    } finally {
      setMemberAttendanceLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMember) {
      loadMemberAttendance(selectedMember.memberId);
    } else {
      setMemberAttendance([]);
    }
  }, [selectedMember]);

  // =========================
  // MEMBER ID DISPLAY
  // =========================
  // New IDs are generated by the backend as 001, 002, 003...
  // Legacy GYM001-style IDs are displayed as 001 while they
  // are being migrated.

  const formatMemberId = (memberId) => {
    if (!memberId) return "—";

    const value = String(memberId);

    if (/^GYM\d+$/i.test(value)) {
      return value.replace(/^GYM/i, "");
    }

    return value;
  };

  const nextMemberNumber = (() => {
    const numericIds = members
      .map((member) => String(member.memberId || ""))
      .filter((id) => /^\d+$/.test(id))
      .map(Number);

    return numericIds.length
      ? String(Math.max(...numericIds) + 1).padStart(3, "0")
      : "001";
  })();

  // =========================
  // NEW MEMBER EXPIRY
  // =========================

  const calculateExpiryDate = () => {
    if (!membership || !formData.joiningDate) {
      return "";
    }

    const date = new Date(formData.joiningDate);

    if (membership === "1 Month") {
      date.setMonth(date.getMonth() + 1);
    }

    if (membership === "3 Months") {
      date.setMonth(date.getMonth() + 3);
    }

    if (membership === "6 Months") {
      date.setMonth(date.getMonth() + 6);
    }

    if (membership === "1 Year") {
      date.setFullYear(date.getFullYear() + 1);
    }

    return date.toISOString().split("T")[0];
  };

  const expiryDate = calculateExpiryDate();

  // =========================
  // INPUT CHANGE
  // =========================

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // SELECT MEMBERSHIP
  // =========================

  const selectMembership = (plan) => {
    setMembership(plan);

    setFormData({
      ...formData,
      amountPaid: membershipPrices[plan],
    });
  };

  // =========================
  // FAKE FINGERPRINT REGISTRATION
  // =========================
  // Generates FP001, FP002, FP003...
  // This simulates a scanner for development/testing.
  const registerFakeFingerprint = () => {
    setFingerprintLoading(true);

    try {
      const existingIds = members
        .map((member) => String(member.fingerprintId || ""))
        .filter((id) => /^FP\d+$/.test(id))
        .map((id) => Number(id.replace("FP", "")));

      const nextNumber =
        existingIds.length > 0
          ? Math.max(...existingIds) + 1
          : 1;

      const newFingerprintId = `FP${String(
        nextNumber
      ).padStart(3, "0")}`;

      setFingerprintId(newFingerprintId);

      showToast(
        `Fingerprint captured successfully: ${newFingerprintId}`,
        "success"
      );
    } catch (error) {
      console.error(
        "Fingerprint registration error:",
        error
      );

      showToast(
        "Could not register fingerprint.",
        "error"
      );
    } finally {
      setFingerprintLoading(false);
    }
  };

  const registerProfileFakeFingerprint = async () => {
    if (!selectedMember) return;

    setFingerprintLoading(true);

    try {
      const existingIds = members
        .map((member) => String(member.fingerprintId || ""))
        .filter((id) => /^FP\d+$/.test(id))
        .filter(
          (id) => id !== String(selectedMember.fingerprintId || "")
        )
        .map((id) => Number(id.replace("FP", "")));

      const nextNumber =
        existingIds.length > 0
          ? Math.max(...existingIds) + 1
          : 1;

      const newFingerprintId = `FP${String(nextNumber).padStart(3, "0")}`;

      const response = await apiFetch(
        `${API_BASE}/api/members/${selectedMember._id}/fingerprint`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fingerprintId: newFingerprintId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Fingerprint registration failed."
        );
      }

      setMembers((currentMembers) =>
        currentMembers.map((member) =>
          member._id === data.member._id
            ? data.member
            : member
        )
      );

      setSelectedMember(data.member);

      showToast(
        `Fingerprint registered successfully: ${newFingerprintId}`,
        "success"
      );
    } catch (error) {
      console.error("Profile fingerprint error:", error);

      showToast(
        error.message || "Could not register fingerprint.",
        "error"
      );
    } finally {
      setFingerprintLoading(false);
    }
  };

  // =========================
  // GATE FINGERPRINT SCAN
  // =========================

  const scanFingerprint = async () => {
    const value = scanFingerprintId.trim();

    if (!value) {
      showToast("Enter a fingerprint ID first.", "warning");
      return;
    }

    setScanLoading(true);
    setScanResult(null);

    try {
      const response = await apiFetch(
        `${API_BASE}/api/attendance/scan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fingerprintId: value,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setScanResult({
          success: false,
          action: "DENIED",
          message: data.message || "Access denied.",
          name: data.member?.name || data.name || "",
          memberId: data.member?.memberId || data.memberId || "",
        });

        showToast(
          data.message || "Access denied.",
          "error"
        );

        return;
      }

      setScanResult(data);
      setScanFingerprintId("");

      await loadMembers();
      await loadAttendance();

      if (data.action === "CHECK_IN") {
        showToast(
          `${data.member?.name || data.name} checked in successfully.`,
          "success"
        );
      }

      if (data.action === "CHECK_OUT") {
        showToast(
          `${data.member?.name || data.name} checked out successfully.`,
          "success"
        );
      }
    } catch (error) {
      console.error("Fingerprint scan error:", error);

      setScanResult({
        success: false,
        action: "ERROR",
        message:
          "Could not connect to the SILELAN server.",
      });

      showToast(
        "Could not connect to backend.",
        "error"
      );
    } finally {
      setScanLoading(false);
    }
  };

  const currentPrice =
    membershipPrices[membership] || 0;

  const amountPaid =
    Number(formData.amountPaid || 0);

  const remainingAmount = Math.max(
    currentPrice - amountPaid,
    0
  );

  const paymentStatus =
    amountPaid >= currentPrice
      ? "PAID"
      : "PAYMENT DUE";

  // =========================
  // CREATE MEMBER
  // =========================

  const createMember = async () => {
    if (!formData.name || !formData.phone || !membership) {
      showToast(
        "Please fill Name, Phone Number and Membership.",
        "warning"
      );
      return;
    }

    if (amountPaid > currentPrice) {
      showToast(
        "Amount paid cannot be greater than membership fee.",
        "warning"
      );
      return;
    }

    setLoading(true);
    const allowedPaymentMethods = [
      "Cash",
      "UPI",
      "Card",
    ];

    const selectedPaymentMethod =
      allowedPaymentMethods.includes(formData.paymentMethod)
        ? formData.paymentMethod
        : "Cash";

    const newMember = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      dob: formData.dob || null,
      membership,
      joiningDate: formData.joiningDate,
      expiryDate,
      paymentStatus,
      amountPaid,
      paymentMethod: selectedPaymentMethod,
      fingerprintId: fingerprintId || null,
    };

    try {
      const response = await apiFetch(
        `${API_BASE}/api/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newMember),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create member"
        );
      }

      setMembers([...members, data.member]);

      setFormData({
        name: "",
        phone: "",
        email: "",
        dob: "",
        joiningDate: new Date()
          .toISOString()
          .split("T")[0],
        amountPaid: "",
        paymentMethod: "Cash",
      });

      setMembership("");
      setFingerprintId("");
      setPage("dashboard");

      showToast(
        `Member ${data.member?.memberId || ""} created successfully!`,
        "success"
      );
    } catch (error) {
      console.error(error);
      showToast(
        error.message ||
          "Could not create member.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // TOTAL COLLECTED PASSWORD
  // =========================

  const openCollectedPassword = () => {
    setCollectedPassword("");
    setShowCollectedPassword(true);
  };

  const closeCollectedPassword = () => {
    setShowCollectedPassword(false);
    setCollectedPassword("");
  };

  const verifyCollectedPassword = async () => {
    if (!collectedPassword.trim()) {
      showToast(
        "Please enter the password.",
        "warning"
      );
      return;
    }

    setCollectedPasswordLoading(true);

    try {
      const response = await apiFetch(
        `${API_BASE}/api/auth/verify-payment-view-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: collectedPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Incorrect password."
        );
      }

      setCollectedUnlocked(true);
      setShowCollectedPassword(false);
      setCollectedPassword("");

      showToast(
        "Total collected amount unlocked.",
        "success"
      );
    } catch (error) {
      console.error(
        "Payment view password error:",
        error
      );

      showToast(
        error.message || "Incorrect password.",
        "error"
      );
    } finally {
      setCollectedPasswordLoading(false);
    }
  };

  // =========================
  // COLLECT PAYMENT
  // =========================

  const collectPayment = async () => {
    if (!collectMember) return;

    const amount = Number(collectAmount);

    if (!amount || amount <= 0) {
      showToast("Please enter a valid amount.", "warning");
      return;
    }

    const totalFee =
      membershipPrices[
        collectMember.membership
      ] || 0;

    const alreadyPaid =
      Number(collectMember.amountPaid) || 0;

    const remaining =
      totalFee - alreadyPaid;

    if (amount > remaining) {
      showToast(`Maximum payment is ₹${remaining}.`, "warning");
      return;
    }

    setPaymentLoading(true);

    try {
      const response = await apiFetch(
        `${API_BASE}/api/members/${collectMember._id}/payment`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            paymentMethod: collectPaymentMethod,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Payment failed."
        );
      }

      setMembers(
        members.map((member) =>
          member._id === data.member._id
            ? data.member
            : member
        )
      );

      setSelectedMember(data.member);

      setCollectMember(null);
      setCollectAmount("");
      setCollectPaymentMethod("Cash");

      showToast(
        "Payment collected successfully!",
        "success"
      );
    } catch (error) {
      showToast(
        error.message ||
          "Could not collect payment.",
        "error"
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  // =========================
  // OPEN RENEWAL
  // =========================

  const openRenewMembership = (member) => {
    setRenewMember(member);
    setRenewPlan("");
    setRenewAmount("");
    setRenewPaymentMethod("Cash");
  };

  // =========================
  // SELECT RENEWAL PLAN
  // =========================

  const selectRenewPlan = (plan) => {
    setRenewPlan(plan);

    setRenewAmount(
      membershipPrices[plan]
    );
  };

  // =========================
  // RENEW MEMBERSHIP
  // =========================

  const renewMembership = async () => {
    if (!renewMember || !renewPlan) {
      showToast("Please select a membership plan.", "warning");
      return;
    }

    const amount = Number(renewAmount || 0);

    const fee =
      membershipPrices[renewPlan];

    if (amount < 0 || amount > fee) {
      showToast(
        "Payment amount must be between ₹0 and the membership fee.",
        "warning"
      );
      return;
    }

    setRenewLoading(true);

    try {
      const response = await apiFetch(
        `${API_BASE}/api/members/${renewMember._id}/renew`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            membership: renewPlan,
            amountPaid: amount,
            paymentMethod: renewPaymentMethod,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Renewal failed."
        );
      }

      setMembers(
        members.map((member) =>
          member._id === data.member._id
            ? data.member
            : member
        )
      );

      setSelectedMember(data.member);

      setRenewMember(null);
      setRenewPlan("");
      setRenewAmount("");
      setRenewPaymentMethod("Cash");

      showToast(
        "Membership renewed successfully!",
        "success"
      );
    } catch (error) {
      console.error(error);

      showToast(
        error.message ||
          "Could not renew membership.",
        "error"
      );
    } finally {
      setRenewLoading(false);
    }
  };

  // =========================

  // =========================
  // MODAL BODY SCROLL LOCK
  // =========================

  useEffect(() => {
    const modalOpen =
      Boolean(collectMember) ||
      Boolean(renewMember) ||
      Boolean(editMember) ||
      Boolean(showDeleteConfirm) ||
      Boolean(showCollectedPassword);

    if (!modalOpen) {
      document.body.style.overflow = "";
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [
    collectMember,
    renewMember,
    editMember,
    showDeleteConfirm,
    showCollectedPassword,
  ]);


  // DELETE MEMBER
  // =========================

  const deleteMember = async () => {
    if (!selectedMember) return;

    setDeleteMemberLoading(true);

    try {
      const response = await apiFetch(
        `${API_BASE}/api/members/${selectedMember._id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete member."
        );
      }

      // Remove the member from the current frontend state
      setMembers((currentMembers) =>
        currentMembers.filter(
          (member) => member._id !== selectedMember._id
        )
      );

      setMemberAttendance([]);
      setShowDeleteConfirm(false);
      setSelectedMember(null);
      setPage("members");

      // Refresh dashboard/attendance data after deletion
      loadMembers();
      loadAttendance();

      showToast(
        `Member ${data.memberId || ""} deleted successfully.`,
        "success"
      );
    } catch (error) {
      console.error(error);

      showToast(
        error.message || "Could not delete member.",
        "error"
      );
    } finally {
      setDeleteMemberLoading(false);
    }
  };

  // =========================
  // OPEN EDIT MEMBER
  // =========================

  const openEditMember = (member) => {
    if (!member) return;

    setEditMember(member);

    setEditForm({
      name: member.name || "",
      phone: member.phone || "",
      email: member.email || "",
      dob: member.dob
        ? new Date(member.dob).toISOString().split("T")[0]
        : "",
    });
  };

  // =========================
  // EDIT MEMBER INPUT CHANGE
  // =========================

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // =========================
  // SAVE EDITED MEMBER
  // =========================

  const saveEditedMember = async () => {
    if (!editMember) return;

    if (!editForm.name.trim()) {
      showToast("Member name is required.", "warning");
      return;
    }

    if (!editForm.phone.trim()) {
      showToast("Phone number is required.", "warning");
      return;
    }

    setEditMemberLoading(true);

    try {
      const response = await apiFetch(
        `${API_BASE}/api/members/${editMember._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editForm.name.trim(),
            phone: editForm.phone.trim(),
            email: editForm.email.trim(),
            dob: editForm.dob || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update member."
        );
      }

      const updatedMember = data.member;

      setMembers((currentMembers) =>
        currentMembers.map((member) =>
          member._id === updatedMember._id
            ? updatedMember
            : member
        )
      );

      setSelectedMember(updatedMember);
      setEditMember(null);

      showToast(
        "Member details updated successfully.",
        "success"
      );
    } catch (error) {
      console.error("Edit member error:", error);

      showToast(
        error.message || "Could not update member.",
        "error"
      );
    } finally {
      setEditMemberLoading(false);
    }
  };

  // =========================
  // SEARCH
  // =========================

  const filteredMembers = members.filter(
    (member) => {
      const search =
        searchQuery.toLowerCase();

      return (
        member.name
          ?.toLowerCase()
          .includes(search) ||
        member.memberId
          ?.toLowerCase()
          .includes(search) ||
        member.phone
          ?.toLowerCase()
          .includes(search)
      );
    }
  );

  // =========================
  // PAYMENT DATA
  // =========================

  const paymentDueMembers =
    members.filter(
      (member) =>
        member.paymentStatus ===
        "PAYMENT DUE"
    );

  const totalPending =
    paymentDueMembers.reduce(
      (total, member) => {
        const fee =
          membershipPrices[
            member.membership
          ] || 0;

        const paid =
          Number(member.amountPaid) || 0;

        return (
          total +
          Math.max(fee - paid, 0)
        );
      },
      0
    );

  const totalCollected =
    members.reduce(
      (total, member) =>
        total +
        (Number(member.amountPaid) || 0),
      0
    );

  // =========================
  // OPEN PROFILE
  // =========================

  const openMemberProfile = (member) => {
    setSelectedMember(member);
    setPage("profile");
  };

  // =========================
  // OPEN COLLECT PAYMENT
  // =========================

  const openCollectPayment = (member) => {
    const fee =
      membershipPrices[
        member.membership
      ] || 0;

    const paid =
      Number(member.amountPaid) || 0;

    const remaining =
      Math.max(fee - paid, 0);

    setCollectMember(member);
    setCollectAmount(remaining);
    setPage("payments");
  };

  // =========================
  // AUTHENTICATION GATE
  // =========================

  if (checkingAuth) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f8fc",
          color: "#111827",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "0.08em" }}>SILELAN</div>
          <p style={{ marginTop: "8px", color: "#6b7280" }}>Checking owner access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "430px",
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "24px",
            padding: "36px",
            boxShadow: "0 20px 60px rgba(15, 23, 42, 0.10)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <img
              src="/silelan-logo.jpeg"
              alt="SILELAN"
              style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "16px", marginBottom: "14px" }}
            />
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 800, color: "#111827" }}>SILELAN</h1>
            <p style={{ margin: "8px 0 0", color: "#6b7280", fontSize: "14px" }}>Owner Console</p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "18px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 700, color: "#374151" }}>Owner Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                placeholder="Enter owner email"
                autoComplete="email"
                style={{ width: "100%", boxSizing: "border-box", padding: "13px 14px", border: "1px solid #d1d5db", borderRadius: "12px", fontSize: "14px", outline: "none" }}
              />
            </div>

            <div style={{ marginBottom: "22px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 700, color: "#374151" }}>Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                style={{ width: "100%", boxSizing: "border-box", padding: "13px 14px", border: "1px solid #d1d5db", borderRadius: "12px", fontSize: "14px", outline: "none" }}
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              style={{ width: "100%", border: "none", borderRadius: "12px", padding: "14px", background: "#111827", color: "#ffffff", fontSize: "14px", fontWeight: 800, cursor: loginLoading ? "not-allowed" : "pointer", opacity: loginLoading ? 0.7 : 1 }}
            >
              {loginLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p style={{ margin: "20px 0 0", textAlign: "center", fontSize: "12px", color: "#9ca3af" }}>
            Authorized owner access only
          </p>
        </div>
      </div>
    );
  }

  // =========================
  // SIDEBAR
  // =========================

  const Sidebar = () => (
    <aside className="sidebar">

      <div className="logo">
        <img
          src="/silelan-logo.jpeg"
          alt="SILELAN"
          className="logo-image"
        />
        <span>SILELAN</span>
      </div>

      <div className="nav-title">
        Management
      </div>

      <div
        className={`nav-item ${
          page === "dashboard"
            ? "active"
            : ""
        }`}
        onClick={() =>
          setPage("dashboard")
        }
      >
        Dashboard
      </div>

      <div
        className={`nav-item ${
          page === "members" ||
          page === "profile"
            ? "active"
            : ""
        }`}
        onClick={() =>
          setPage("members")
        }
      >
        Members
      </div>

      <div
        className={`nav-item ${
          page === "payments"
            ? "active"
            : ""
        }`}
        onClick={() =>
          setPage("payments")
        }
      >
        Payments
      </div>

      <div
        className={`nav-item ${
          page === "attendance" ? "active" : ""
        }`}
        onClick={() => setPage("attendance")}
      >
        Attendance
      </div>

      <div
        className={`nav-item ${
          page === "gate-scan" ? "active" : ""
        }`}
        onClick={() => setPage("gate-scan")}
      >
        Gate Scan
      </div>

      <div className="sidebar-spacer" />

      <div className="sidebar-pulse-card">
        <div className="sidebar-pulse-header">
          <div>
            <span className="sidebar-pulse-kicker">LIVE OVERVIEW</span>
            <strong>Gym Pulse</strong>
          </div>
          <span className="sidebar-pulse-live">
            <span className="sidebar-status-dot" />
            LIVE
          </span>
        </div>

        <div className="sidebar-pulse-grid">
          <div className="sidebar-pulse-metric">
            <span>INSIDE</span>
            <strong>{currentlyInside.length}</strong>
          </div>
          <div className="sidebar-pulse-metric">
            <span>ENTRIES</span>
            <strong>{todayAttendance.length}</strong>
          </div>
          <div className="sidebar-pulse-metric alert">
            <span>DUE</span>
            <strong>{paymentDueMembers.length}</strong>
          </div>
          <div className="sidebar-pulse-metric">
            <span>MEMBERS</span>
            <strong>{members.length}</strong>
          </div>
        </div>

        <div className="sidebar-pulse-footer">
          <span className="sidebar-status-dot" />
          SYSTEM ONLINE
        </div>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        style={{
          width: "100%",
          marginBottom: "14px",
          padding: "10px 12px",
          borderRadius: "10px",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.06)",
          color: "inherit",
          cursor: "pointer",
          fontWeight: 700,
        }}
      >
        Log Out
      </button>

      <div className="sidebar-footer">
        <span>SILELAN</span>
        <small>OWNER CONSOLE</small>
      </div>

    </aside>
  );

  // =====================================================
  // GATE SCAN PAGE
  // =====================================================

  if (page === "gate-scan") {
    return (
      <div className="app">
        <Sidebar />

        <main className="main">
          <div className="header">
            <div>
              <p>BIOMETRIC ACCESS</p>
              <h1>Gate Scan</h1>
            </div>

            <div className="header-actions">
              <button
                className="back-button"
                onClick={() => setPage("dashboard")}
              >
                ← Dashboard
              </button>
            </div>
          </div>

          <div className="dashboard-grid">
            <section className="form-card">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">SCANNER TEST</span>
                  <h2>Test Fingerprint Access</h2>
                </div>
              </div>

              <p className="muted-text">
                Temporary testing mode. Enter a registered fingerprint ID
                such as FP001. Later this input will be replaced by the
                physical vendor scanner/API event.
              </p>

              <div className="form-group">
                <label>Fingerprint ID</label>
                <input
                  type="text"
                  value={scanFingerprintId}
                  onChange={(event) =>
                    setScanFingerprintId(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      scanFingerprint();
                    }
                  }}
                  placeholder="e.g. FP001"
                  autoComplete="off"
                />
              </div>

              <button
                className="primary-button"
                onClick={scanFingerprint}
                disabled={scanLoading}
              >
                {scanLoading
                  ? "Scanning..."
                  : "Scan Fingerprint"}
              </button>

              {scanResult && (
                <div
                  className={`scan-result-card ${
                    scanResult.success
                      ? "scan-result-success"
                      : "scan-result-error"
                  }`}
                >
                  <div className="scan-result-top">
                    <strong>
                      {scanResult.action === "CHECK_IN"
                        ? "CHECK-IN SUCCESS"
                        : scanResult.action === "CHECK_OUT"
                          ? "CHECK-OUT SUCCESS"
                          : scanResult.action === "DENIED"
                            ? "ACCESS DENIED"
                            : "SCAN ERROR"}
                    </strong>

                    <span>
                      {scanResult.success ? "✓" : "!"}
                    </span>
                  </div>

                  {scanResult.name && (
                    <p>
                      <strong>Name:</strong>{" "}
                      {scanResult.name}
                    </p>
                  )}

                  {scanResult.memberId && (
                    <p>
                      <strong>Member ID:</strong>{" "}
                      {scanResult.memberId}
                    </p>
                  )}

                  <p>
                    <strong>Message:</strong>{" "}
                    {scanResult.message ||
                      (scanResult.action === "CHECK_IN"
                        ? "Member checked in."
                        : scanResult.action === "CHECK_OUT"
                          ? "Member checked out."
                          : "Access denied.")}
                  </p>
                </div>
              )}
            </section>

            <section className="form-card">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">LIVE STATUS</span>
                  <h2>Currently Inside</h2>
                </div>

                <strong className="large-stat">
                  {currentlyInside.length}
                </strong>
              </div>

              {currentlyInside.length === 0 ? (
                <div className="empty-state">
                  No members are currently inside.
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Member</th>
                        <th>Check In</th>
                      </tr>
                    </thead>

                    <tbody>
                      {currentlyInside.map((entry) => (
                        <tr key={entry._id}>
                          <td>{entry.memberId}</td>
                          <td>{entry.name}</td>
                          <td>{entry.checkIn}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <section className="table-card">
            <div className="section-heading">
              <div>
                <span className="section-kicker">TODAY</span>
                <h2>Today's Gate Scans</h2>
              </div>

              <span className="count-badge">
                {todayAttendance.length} scans
              </span>
            </div>

            {todayAttendance.length === 0 ? (
              <div className="empty-state">
                No gate scans recorded today.
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Member ID</th>
                      <th>Name</th>
                      <th>Date</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                    </tr>
                  </thead>

                  <tbody>
                    {todayAttendance.map((entry) => (
                      <tr key={entry._id}>
                        <td>{entry.memberId}</td>
                        <td>{entry.name}</td>
                        <td>{entry.date}</td>
                        <td>{entry.checkIn}</td>
                        <td>{entry.checkOut || "Inside"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  // =====================================================
  // NEW MEMBER PAGE
  // =====================================================

  if (page === "new-member") {
    return (
      <div className="app">

        <Sidebar />

        <main className="main">

          <div className="header">

            <div>
              <p>MEMBERS</p>
              <h1>New Member</h1>
            </div>

            <button
              className="back-button"
              onClick={() =>
                setPage("dashboard")
              }
            >
              ← Back
            </button>

          </div>


          <div className="form-card">

            <div className="member-id-box">

              <span>MEMBER ID</span>

              <strong>
                {nextMemberNumber}
              </strong>

            </div>


            <h2>
              Personal Details
            </h2>


            <div className="form-grid">

              <div className="form-group">

                <label>
                  Full Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                />

              </div>


              <div className="form-group">

                <label>
                  Phone Number
                </label>

                <input
  type="tel"
  name="phone"
  value={formData.phone}
  onChange={(e) =>
    setFormData({
      ...formData,
      phone: e.target.value.replace(/\D/g, "").slice(0, 10)
    })
  }
  placeholder="Enter phone number"
/>

              </div>


              <div className="form-group">

                <label>Email</label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                />

              </div>


              <div className="form-group">

                <label>
                  Date of Birth
                </label>

                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                />

              </div>


              <div className="form-group">

                <label>
                  Joining Date
                </label>

                <input
                  type="date"
                  name="joiningDate"
                  value={
                    formData.joiningDate
                  }
                  onChange={handleChange}
                />

              </div>

            </div>


            <h2>Membership</h2>


            <div className="membership-options">

              {Object.entries(
                membershipPrices
              ).map(
                ([plan, price]) => (

                  <button
                    key={plan}
                    className={
                      membership === plan
                        ? "selected"
                        : ""
                    }
                    onClick={() =>
                      selectMembership(plan)
                    }
                  >

                    <span>
                      {plan}
                    </span>

                    <strong>
                      ₹
                      {price.toLocaleString(
                        "en-IN"
                      )}
                    </strong>

                  </button>

                )
              )}

            </div>


            {membership && (

              <div className="membership-summary">

                <div>

                  <span>
                    Membership Fee
                  </span>

                  <strong>
                    ₹
                    {currentPrice.toLocaleString(
                      "en-IN"
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    Expiry Date
                  </span>

                  <strong>
                    {new Date(
                      expiryDate
                    ).toLocaleDateString(
                      "en-IN"
                    )}
                  </strong>

                </div>

              </div>

            )}


            {membership && (

              <div className="payment-section">

                <h2>Payment</h2>

                <div className="payment-grid">

                  <div className="form-group">

                    <label>
                      Amount Paid
                    </label>

                    <input
                      type="number"
                      name="amountPaid"
                      value={
                        formData.amountPaid
                      }
                      onChange={handleChange}
                      min="0"
                      max={currentPrice}
                    />

                  </div>


                  <div className="form-group">

                    <label>
                      Payment Method
                    </label>

                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod || "Cash"}
                      onChange={handleChange}
                      className="payment-method-select"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                    </select>

                  </div>


                  <div className="payment-status-preview">

                    <label>
                      Payment Status
                    </label>

                    <div
                      className={
                        paymentStatus ===
                        "PAID"
                          ? "payment-paid"
                          : "payment-due"
                      }
                    >
                      {paymentStatus}
                    </div>

                  </div>

                </div>


                <div className="payment-summary">

                  <div>
                    <span>Total Fee</span>

                    <strong>
                      ₹
                      {currentPrice.toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>


                  <div>
                    <span>Amount Paid</span>

                    <strong>
                      ₹
                      {amountPaid.toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>


                  <div>
                    <span>Remaining</span>

                    <strong
                      className={
                        remainingAmount > 0
                          ? "remaining-due"
                          : "remaining-paid"
                      }
                    >
                      ₹
                      {remainingAmount.toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>

                </div>

              </div>

            )}


            <div className="fingerprint-section">

              <h2>
                Fingerprint Registration
              </h2>

              <p>
                Register the member's fingerprint before
                creating the member.
              </p>

              <button
                type="button"
                className="scan-button"
                onClick={registerFakeFingerprint}
                disabled={fingerprintLoading}
              >
                {fingerprintLoading
                  ? "Capturing..."
                  : fingerprintId
                  ? `Fingerprint Registered (${fingerprintId})`
                  : "Register Fingerprint"}
              </button>

              {fingerprintId && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "#ecfdf5",
                    color: "#047857",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  Test Fingerprint ID: {fingerprintId}
                </div>
              )}

            </div>


            <div className="form-actions">

              <button
                className="cancel-button"
                onClick={() =>
                  setPage("dashboard")
                }
              >
                Cancel
              </button>


              <button
                className="new-member"
                onClick={createMember}
                disabled={loading}
              >
                {loading
                  ? "Creating..."
                  : "Create Member"}
              </button>

            </div>

          </div>

        </main>

      </div>
    );
  }

  // =====================================================
  // PAYMENTS PAGE
  // =====================================================

  if (page === "payments") {
    return (
      <div className="app">

        <Sidebar />

        <main className="main">

          <div className="header">

            <div>
              <p>MANAGEMENT</p>
              <h1>Payments</h1>
            </div>

          </div>


          <div className="stats">

            <div className="card collected-stat-card">

              <div className="card-title">
                Total Collected
              </div>

              {!collectedUnlocked ? (
                <button
                  type="button"
                  className="collected-locked-value"
                  onClick={openCollectedPassword}
                  aria-label="Unlock total collected amount"
                >
                  <span className="collected-lock-icon">
                    🔒
                  </span>

                  <span className="collected-hidden-amount">
                    ••••••••
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  className="collected-visible-value"
                  onClick={() => setCollectedUnlocked(false)}
                  title="Click to hide"
                >
                  ₹
                  {totalCollected.toLocaleString(
                    "en-IN"
                  )}
                </button>
              )}

            </div>


            <div className="card">

              <div className="card-title">
                Pending Amount
              </div>

              <div className="card-number payment-red">
                ₹
                {totalPending.toLocaleString(
                  "en-IN"
                )}
              </div>

            </div>


            <div className="card">

              <div className="card-title">
                Members With Dues
              </div>

              <div className="card-number">
                {paymentDueMembers.length}
              </div>

            </div>

          </div>


          <section className="activity">

            <div className="members-page-header">

              <h2>
                Pending Payments
              </h2>

              <span>
                {paymentDueMembers.length} pending
              </span>

            </div>


            {paymentDueMembers.length ===
            0 ? (

              <div className="empty-members">
                <p>
                  No pending payments 🎉
                </p>
              </div>

            ) : (

              <div className="table">

                <div className="table-header">

                  <div>MEMBER</div>
                  <div>TOTAL FEE</div>
                  <div>PAID</div>
                  <div>REMAINING</div>
                  <div>ACTION</div>

                </div>


                {paymentDueMembers.map(
                  (member) => {

                    const fee =
                      membershipPrices[
                        member.membership
                      ] || 0;

                    const paid =
                      Number(
                        member.amountPaid
                      ) || 0;

                    const remaining =
                      Math.max(
                        fee - paid,
                        0
                      );

                    return (

                      <div
                        className="payment-row"
                        key={member._id}
                      >

                        <div>

                          <strong>
                            {member.name}
                          </strong>

                          <span className="member-id">
                            {member.memberId}
                          </span>

                        </div>


                        <div>
                          ₹
                          {fee.toLocaleString(
                            "en-IN"
                          )}
                        </div>


                        <div>
                          ₹
                          {paid.toLocaleString(
                            "en-IN"
                          )}
                        </div>


                        <div className="remaining-due">
                          ₹
                          {remaining.toLocaleString(
                            "en-IN"
                          )}
                        </div>


                        <div>

                          <button
                            className="collect-button"
                            onClick={() =>
                              openCollectPayment(
                                member
                              )
                            }
                          >
                            Collect Payment
                          </button>

                        </div>

                      </div>

                    );
                  }
                )}

              </div>

            )}

          </section>


          {/* PAYMENT MODAL */}

          {collectMember && (

            <div className="modal-overlay">

              <div className="payment-modal">

                <div className="modal-header">

                  <div>

                    <p>
                      COLLECT PAYMENT
                    </p>

                    <h2>
                      {collectMember.name}
                    </h2>

                    <span>
                      {collectMember.memberId}
                    </span>

                  </div>


                  <button
                    className="modal-close"
                    onClick={() => {
                      setCollectMember(null);
                      setCollectAmount("");
                      setCollectPaymentMethod("Cash");
                    }}
                  >
                    ×
                  </button>

                </div>


                <div className="modal-payment-info">

                  <div>
                    <span>Total Fee</span>

                    <strong>
                      ₹
                      {(
                        membershipPrices[
                          collectMember.membership
                        ] || 0
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>


                  <div>
                    <span>Already Paid</span>

                    <strong>
                      ₹
                      {Number(
                        collectMember.amountPaid ||
                          0
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>


                  <div>
                    <span>Remaining</span>

                    <strong className="remaining-due">
                      ₹
                      {Math.max(
                        (
                          membershipPrices[
                            collectMember.membership
                          ] || 0
                        ) -
                          (
                            Number(
                              collectMember.amountPaid
                            ) || 0
                          ),
                        0
                      ).toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>

                </div>


                <div className="form-group">

                  <label>
                    Payment Amount
                  </label>

                  <input
                    type="number"
                    value={collectAmount}
                    onChange={(e) =>
                      setCollectAmount(
                        e.target.value
                      )
                    }
                    min="1"
                  />

                </div>


                <div className="form-group payment-method-field">

                  <label>
                    Payment Method
                  </label>

                  <select
                    value={collectPaymentMethod}
                    onChange={(e) =>
                      setCollectPaymentMethod(e.target.value)
                    }
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                  </select>

                </div>


                <div className="modal-actions">

                  <button
                    className="cancel-button"
                    onClick={() => {
                      setCollectMember(null);
                      setCollectAmount("");
                      setCollectPaymentMethod("Cash");
                    }}
                  >
                    Cancel
                  </button>


                  <button
                    className="new-member"
                    onClick={collectPayment}
                    disabled={
                      paymentLoading
                    }
                  >
                    {paymentLoading
                      ? "Saving..."
                      : "Confirm Payment"}
                  </button>

                </div>

              </div>

            </div>

          )}

          {/* TOTAL COLLECTED PASSWORD MODAL */}

          {showCollectedPassword && (
            <div
              className="modal-overlay collected-password-overlay"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                  closeCollectedPassword();
                }
              }}
            >

              <div
                className="collected-password-modal"
                onMouseDown={(e) => e.stopPropagation()}
              >

                <div className="collected-password-header">

                  <div>
                    <p>
                      PROTECTED PAYMENT DATA
                    </p>

                    <h2>
                      Total Collected
                    </h2>

                    <span>
                      Enter password to view the collected amount.
                    </span>
                  </div>

                  <button
                    type="button"
                    className="modal-close"
                    onClick={closeCollectedPassword}
                    aria-label="Close"
                  >
                    ×
                  </button>

                </div>

                <div className="collected-password-body">

                  <div className="collected-security-icon">
                    🔒
                  </div>

                  <p className="collected-password-message">
                    This amount is protected. Please enter your payment viewing password to continue.
                  </p>

                  <div className="form-group collected-password-field">
                    <label htmlFor="collected-password">
                      Password
                    </label>

                    <input
                      id="collected-password"
                      type="password"
                      value={collectedPassword}
                      onChange={(e) =>
                        setCollectedPassword(e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          verifyCollectedPassword();
                        }
                      }}
                      placeholder="Enter password"
                      autoFocus
                      autoComplete="current-password"
                    />
                  </div>

                </div>

                <div className="modal-actions">

                  <button
                    type="button"
                    className="cancel-button"
                    onClick={closeCollectedPassword}
                    disabled={collectedPasswordLoading}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="new-member"
                    onClick={verifyCollectedPassword}
                    disabled={collectedPasswordLoading}
                  >
                    {collectedPasswordLoading
                      ? "Checking..."
                      : "Unlock Amount"}
                  </button>

                </div>

              </div>

            </div>
          )}

        </main>

      </div>
    );
  }

  // =====================================================
  // PROFILE PAGE
  // =====================================================

  if (
    page === "profile" &&
    selectedMember
  ) {

    const memberFee =
      membershipPrices[
        selectedMember.membership
      ] || 0;

    const memberPaid =
      Number(
        selectedMember.amountPaid
      ) || 0;

    const memberRemaining =
      Math.max(
        memberFee - memberPaid,
        0
      );

    const paymentHistory =
      selectedMember.paymentHistory || [];

    return (
      <div className="app">

        <Sidebar />

        <main className="main">

          <div className="header">

            <div>

              <p>
                MEMBER PROFILE
              </p>

              <h1>
                {selectedMember.name}
              </h1>

            </div>


            <button
              className="back-button"
              onClick={() =>
                setPage("members")
              }
            >
              ← Back to Members
            </button>

          </div>


          {/* PROFILE HEADER */}

          <div className="profile-header">

            <div className="profile-avatar">
              {selectedMember.name
                .charAt(0)
                .toUpperCase()}
            </div>


            <div className="profile-name">

              <h2>
                {selectedMember.name}
              </h2>

              <span>
                {selectedMember.memberId}
              </span>

            </div>


            <div
              className={`profile-status ${
                getStatusInfo(selectedMember).className
              }`}
            >
              {getStatusInfo(selectedMember).label}
            </div>

          </div>


          {/* PROFILE CARDS */}

          <div className="profile-grid">

            {/* PERSONAL */}

            <div className="profile-card">

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "18px",
                }}
              >

                <h2 style={{ margin: 0 }}>
                  Personal Details
                </h2>

                <button
                  className="view-members-button"
                  onClick={() =>
                    openEditMember(selectedMember)
                  }
                >
                  Edit Member
                </button>

              </div>

              <div className="detail-row">
                <span>Full Name</span>
                <strong>
                  {selectedMember.name}
                </strong>
              </div>

              <div className="detail-row">
                <span>Phone</span>
                <strong>
                  {selectedMember.phone}
                </strong>
              </div>

              <div className="detail-row">
                <span>Email</span>
                <strong>
                  {selectedMember.email ||
                    "Not provided"}
                </strong>
              </div>

              <div className="detail-row">
                <span>Date of Birth</span>
                <strong>
                  {selectedMember.dob
                    ? new Date(
                        selectedMember.dob
                      ).toLocaleDateString(
                        "en-IN"
                      )
                    : "Not provided"}
                </strong>
              </div>

            </div>


            {/* MEMBERSHIP */}

            <div className="profile-card">

              <h2>
                Membership
              </h2>

              <div className="detail-row">
                <span>Plan</span>
                <strong>
                  {selectedMember.membership}
                </strong>
              </div>

              <div className="detail-row">
                <span>Membership Fee</span>
                <strong>
                  ₹
                  {memberFee.toLocaleString(
                    "en-IN"
                  )}
                </strong>
              </div>

              <div className="detail-row">
                <span>Joining Date</span>
                <strong>
                  {selectedMember.joiningDate
                    ? new Date(
                        selectedMember.joiningDate
                      ).toLocaleDateString(
                        "en-IN"
                      )
                    : "Not available"}
                </strong>
              </div>

              <div className="detail-row">
                <span>Expiry Date</span>
                <strong>
                  {selectedMember.expiryDate
                    ? new Date(
                        selectedMember.expiryDate
                      ).toLocaleDateString(
                        "en-IN"
                      )
                    : "Not calculated"}
                </strong>
              </div>

              <div className="detail-row">
                <span>Status</span>

                <strong
                  className={
                    selectedMember.paymentStatus === "PAYMENT DUE" ||
                    selectedMember.paymentStatus === "EXPIRED"
                      ? "red-text"
                      : "green-text"
                  }
                >
                  {getStatusInfo(selectedMember).label}
                </strong>
              </div>


              {/* RENEW BUTTON */}

              <button
                className="renew-button"
                onClick={() =>
                  openRenewMembership(
                    selectedMember
                  )
                }
              >
                Renew Membership
              </button>

            </div>


            {/* PAYMENT */}

            <div className="profile-card">

              <h2>
                Payment
              </h2>

              <div className="detail-row">
                <span>Total Fee</span>
                <strong>
                  ₹
                  {memberFee.toLocaleString(
                    "en-IN"
                  )}
                </strong>
              </div>

              <div className="detail-row">
                <span>Amount Paid</span>
                <strong>
                  ₹
                  {memberPaid.toLocaleString(
                    "en-IN"
                  )}
                </strong>
              </div>

              <div className="detail-row">
                <span>Remaining</span>

                <strong
                  className={
                    memberRemaining > 0
                      ? "red-text"
                      : "green-text"
                  }
                >
                  ₹
                  {memberRemaining.toLocaleString(
                    "en-IN"
                  )}
                </strong>
              </div>

              <div className="detail-row">
                <span>
                  Payment Status
                </span>

                <strong
                  className={
                    selectedMember.paymentStatus === "EXPIRED" ||
                    memberRemaining > 0
                      ? "red-text"
                      : "green-text"
                  }
                >
                  {selectedMember.paymentStatus === "EXPIRED"
                    ? "EXPIRED"
                    : memberRemaining > 0
                    ? "PAYMENT DUE"
                    : "PAID"}
                </strong>
              </div>


              {memberRemaining > 0 && (

                <button
                  className="collect-button profile-collect"
                  onClick={() =>
                    openCollectPayment(
                      selectedMember
                    )
                  }
                >
                  Collect Payment
                </button>

              )}

            </div>


            {/* ATTENDANCE */}

            <div className="profile-card">

              <h2>
                Attendance
              </h2>

              <div className="detail-row">
                <span>
                  Total Visits
                </span>

                <strong>
                  {memberAttendance.length}
                </strong>
              </div>

              <div className="detail-row">
                <span>
                  Last Visit
                </span>

                <strong>
                  {memberAttendance.length > 0
                    ? new Date(
                        memberAttendance[0].date
                      ).toLocaleDateString("en-IN")
                    : "No attendance yet"}
                </strong>
              </div>

            </div>

          </div>


          {/* ATTENDANCE HISTORY */}

          <section className="activity payment-history-section">

            <div className="members-page-header">

              <div>

                <h2>
                  Attendance History
                </h2>

                <p className="section-subtitle">
                  All visits recorded for this member
                </p>

              </div>

              <span>
                {memberAttendance.length} visit
                {memberAttendance.length !== 1 ? "s" : ""}
              </span>

            </div>

            {memberAttendanceLoading ? (
              <div className="empty-state">
                Loading attendance...
              </div>
            ) : memberAttendance.length === 0 ? (
              <div className="empty-state">
                No attendance records yet.
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="members-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Duration</th>
                    </tr>
                  </thead>

                  <tbody>
                    {memberAttendance.map((record) => (
                      <tr key={record._id}>
                        <td>
                          {new Date(
                            record.date
                          ).toLocaleDateString("en-IN")}
                        </td>
                        <td>
                          {record.checkIn || "-"}
                        </td>
                        <td>
                          {record.checkOut || "Inside"}
                        </td>
                        <td>
                          {record.durationMinutes != null
                            ? `${record.durationMinutes} min`
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </section>


          {/* PAYMENT HISTORY */}

          <section className="activity payment-history-section">

            <div className="members-page-header">

              <div>

                <h2>
                  Payment History
                </h2>

                <p className="section-subtitle">
                  All payments made by this member
                </p>

              </div>

              <span>
                {paymentHistory.length}{" "}
                payment
                {paymentHistory.length !== 1
                  ? "s"
                  : ""}
              </span>

            </div>


            {paymentHistory.length === 0 ? (

              <div className="empty-members">

                <p>
                  No payment history yet.
                </p>

              </div>

            ) : (

              <div className="payment-history-list">

                {paymentHistory
                  .slice()
                  .reverse()
                  .map(
                    (payment, index) => (

                      <div
                        className="history-row"
                        key={
                          payment._id ||
                          index
                        }
                      >

                        <div className="history-number">
                          {paymentHistory.length -
                            index}
                        </div>


                        <div className="history-details">

                          <strong>
                            ₹
                            {Number(
                              payment.amount
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </strong>

                          <span>
                            Payment received
                          </span>

                        </div>


                        <div className="history-date">

                          <span>
                            DATE
                          </span>

                          <strong>
                            {payment.paymentDate
                              ? new Date(
                                  payment.paymentDate
                                ).toLocaleDateString(
                                  "en-IN"
                                )
                              : "—"}
                          </strong>

                        </div>


                        <div className="history-method">

                          <span>
                            METHOD
                          </span>

                          <strong>
                            {payment.paymentMethod ||
                              "Cash"}
                          </strong>

                        </div>


                        <div className="history-status">
                          PAID
                        </div>

                      </div>

                    )
                  )}

              </div>

            )}

          </section>


          {/* FINGERPRINT */}

          <div className="profile-card fingerprint-card">

            <div>

              <h2>
                Fingerprint
              </h2>

              <p>
                {selectedMember.fingerprintId
                  ? "Fingerprint registered"
                  : "Fingerprint not registered"}
              </p>

            </div>


            <button
              className="scan-button"
              onClick={registerProfileFakeFingerprint}
              disabled={fingerprintLoading}
            >

              {fingerprintLoading
                ? "Capturing..."
                : selectedMember.fingerprintId
                ? "Update Fingerprint"
                : "Register Fingerprint"}

            </button>

          </div>


          {/* DELETE MEMBER */}

          <div
            className="profile-card"
            style={{
              marginTop: "18px",
              border: "1px solid rgba(255, 60, 60, 0.35)",
              background: "rgba(255, 40, 40, 0.04)",
            }}
          >

            <div>

              <h2 style={{ color: "#ff4d4d" }}>
                Danger Zone
              </h2>

              <p>
                Permanently delete this member and
                all of their attendance records.
              </p>

            </div>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleteMemberLoading}
              style={{
                background: "#ff2b2b",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "12px 20px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Delete Member
            </button>

          </div>


          {/* =========================
              DELETE CONFIRMATION MODAL
          ========================= */}

          {showDeleteConfirm && (

            <div className="modal-overlay">

              <div
                className="renew-modal"
                style={{
                  maxWidth: "500px",
                  border: "1px solid rgba(255, 50, 50, 0.4)",
                }}
              >

                <div className="modal-header">

                  <div>

                    <p style={{ color: "#ff4d4d" }}>
                      DELETE MEMBER
                    </p>

                    <h2>
                      {selectedMember.name}
                    </h2>

                    <span>
                      {selectedMember.memberId}
                    </span>

                  </div>


                  <button
                    className="modal-close"
                    onClick={() =>
                      setShowDeleteConfirm(false)
                    }
                    disabled={deleteMemberLoading}
                  >
                    ×
                  </button>

                </div>


                <div style={{ padding: "20px 0" }}>

                  <p
                    style={{
                      lineHeight: "1.6",
                      color: "#cfcfcf",
                      margin: 0,
                    }}
                  >
                    Are you sure you want to permanently
                    delete this member?
                  </p>

                  <p
                    style={{
                      lineHeight: "1.6",
                      color: "#ff7777",
                      marginTop: "10px",
                      marginBottom: 0,
                    }}
                  >
                    This will also delete all attendance
                    records for this member. This action
                    cannot be undone.
                  </p>

                </div>


                <div className="modal-actions">

                  <button
                    className="cancel-button"
                    onClick={() =>
                      setShowDeleteConfirm(false)
                    }
                    disabled={deleteMemberLoading}
                  >
                    Cancel
                  </button>


                  <button
                    onClick={deleteMember}
                    disabled={deleteMemberLoading}
                    style={{
                      background: "#ff2b2b",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "12px 20px",
                      fontWeight: "700",
                      cursor: deleteMemberLoading
                        ? "not-allowed"
                        : "pointer",
                      opacity: deleteMemberLoading
                        ? 0.7
                        : 1,
                    }}
                  >
                    {deleteMemberLoading
                      ? "Deleting..."
                      : "Delete Permanently"}
                  </button>

                </div>

              </div>

            </div>

          )}


          {/* =========================
              EDIT MEMBER MODAL
          ========================= */}

          {editMember && (

            <div className="modal-overlay">

              <div
                className="renew-modal"
                style={{
                  maxWidth: "620px",
                }}
              >

                <div className="modal-header">

                  <div>
                    <p>EDIT MEMBER</p>
                    <h2>{editMember.name}</h2>
                    <span>{editMember.memberId}</span>
                  </div>

                  <button
                    className="modal-close"
                    onClick={() => {
                      if (!editMemberLoading) {
                        setEditMember(null);
                      }
                    }}
                    disabled={editMemberLoading}
                  >
                    ×
                  </button>

                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px",
                    marginTop: "20px",
                  }}
                >

                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={editForm.name}
                      onChange={handleEditChange}
                      placeholder="Enter full name"
                      disabled={editMemberLoading}
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      value={editForm.phone}
                      onChange={handleEditChange}
                      placeholder="Enter phone number"
                      disabled={editMemberLoading}
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={editForm.email}
                      onChange={handleEditChange}
                      placeholder="Enter email"
                      disabled={editMemberLoading}
                    />
                  </div>

                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      name="dob"
                      value={editForm.dob}
                      onChange={handleEditChange}
                      disabled={editMemberLoading}
                    />
                  </div>

                </div>

                <div className="modal-actions">

                  <button
                    className="cancel-button"
                    onClick={() => {
                      if (!editMemberLoading) {
                        setEditMember(null);
                      }
                    }}
                    disabled={editMemberLoading}
                  >
                    Cancel
                  </button>

                  <button
                    className="new-member"
                    onClick={saveEditedMember}
                    disabled={editMemberLoading}
                  >
                    {editMemberLoading
                      ? "Saving..."
                      : "Save Changes"}
                  </button>

                </div>

              </div>

            </div>

          )}


          {/* =========================
              RENEWAL MODAL
          ========================= */}

          {renewMember && (

            <div className="modal-overlay">

              <div className="renew-modal">

                <div className="modal-header">

                  <div>

                    <p>
                      MEMBERSHIP RENEWAL
                    </p>

                    <h2>
                      {renewMember.name}
                    </h2>

                    <span>
                      {renewMember.memberId}
                    </span>

                  </div>


                  <button
                    className="modal-close"
                    onClick={() => {
                      setRenewMember(null);
                      setRenewPlan("");
                      setRenewAmount("");
                      setRenewPaymentMethod("Cash");
                    }}
                  >
                    ×
                  </button>

                </div>


                <div className="current-membership">

                  <span>
                    CURRENT MEMBERSHIP
                  </span>

                  <strong>
                    {renewMember.membership}
                  </strong>

                  <small>
                    Expires:{" "}
                    {renewMember.expiryDate
                      ? new Date(
                          renewMember.expiryDate
                        ).toLocaleDateString(
                          "en-IN"
                        )
                      : "—"}
                  </small>

                </div>


                <h3>
                  Select New Plan
                </h3>


                <div className="renew-options">

                  {Object.entries(
                    membershipPrices
                  ).map(
                    ([plan, price]) => (

                      <button
                        key={plan}
                        className={
                          renewPlan === plan
                            ? "selected"
                            : ""
                        }
                        onClick={() =>
                          selectRenewPlan(
                            plan
                          )
                        }
                      >

                        <span>
                          {plan}
                        </span>

                        <strong>
                          ₹
                          {price.toLocaleString(
                            "en-IN"
                          )}
                        </strong>

                      </button>

                    )
                  )}

                </div>


                {renewPlan && (

                  <div className="renew-payment">

                    <div className="form-group">

                      <label>
                        Amount Paid
                      </label>

                      <input
                        type="number"
                        value={
                          renewAmount
                        }
                        onChange={(e) =>
                          setRenewAmount(
                            e.target.value
                          )
                        }
                        min="0"
                        max={
                          membershipPrices[
                            renewPlan
                          ]
                        }
                      />

                    </div>


                    <div className="form-group">

                      <label>
                        Payment Method
                      </label>

                      <select
                        value={renewPaymentMethod}
                        onChange={(e) =>
                          setRenewPaymentMethod(e.target.value)
                        }
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="Card">Card</option>
                      </select>

                    </div>


                    <div className="renew-fee-box">

                      <span>
                        Membership Fee
                      </span>

                      <strong>
                        ₹
                        {membershipPrices[
                          renewPlan
                        ].toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                    </div>


                    <div className="renew-fee-box">

                      <span>
                        Remaining
                      </span>

                      <strong
                        className={
                          Number(
                            renewAmount
                          ) <
                          membershipPrices[
                            renewPlan
                          ]
                            ? "remaining-due"
                            : "remaining-paid"
                        }
                      >
                        ₹
                        {Math.max(
                          membershipPrices[
                            renewPlan
                          ] -
                            Number(
                              renewAmount ||
                                0
                            ),
                          0
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                    </div>

                  </div>

                )}


                <div className="modal-actions">

                  <button
                    className="cancel-button"
                    onClick={() => {
                      setRenewMember(null);
                      setRenewPlan("");
                      setRenewAmount("");
                      setRenewPaymentMethod("Cash");
                    }}
                  >
                    Cancel
                  </button>


                  <button
                    className="new-member"
                    onClick={
                      renewMembership
                    }
                    disabled={
                      renewLoading ||
                      !renewPlan
                    }
                  >
                    {renewLoading
                      ? "Renewing..."
                      : "Confirm Renewal"}
                  </button>

                </div>

              </div>

            </div>

          )}

        </main>

      </div>
    );
  }

  // =====================================================
  // MEMBERS PAGE
  // =====================================================

  if (page === "members") {
    return (
      <div className="app">

        <Sidebar />

        <main className="main">

          <div className="header">

            <div>
              <p>MANAGEMENT</p>
              <h1>Members</h1>
            </div>

            <button
              className="new-member"
              onClick={() =>
                setPage("new-member")
              }
            >
              + New Member
            </button>

          </div>


          <div className="search-box">

            <input
              type="text"
              placeholder="Search by name, member ID or phone..."
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(
                  e.target.value
                )
              }
            />

          </div>


          <section className="activity">

            <div className="members-page-header">

              <h2>
                All Members
              </h2>

              <span>
                {filteredMembers.length}{" "}
                member
                {filteredMembers.length !== 1
                  ? "s"
                  : ""}
              </span>

            </div>


            {filteredMembers.length ===
            0 ? (

              <div className="empty-members">
                <p>
                  No members found.
                </p>
              </div>

            ) : (

              <div className="table">

                <div className="table-header">

                  <div>MEMBER</div>
                  <div>PHONE</div>
                  <div>MEMBERSHIP</div>
                  <div>STATUS</div>

                </div>


                {filteredMembers.map(
                  (member) => (

                    <div
                      className="member-row clickable-row"
                      key={member._id}
                      onClick={() =>
                        openMemberProfile(
                          member
                        )
                      }
                    >

                      <div>

                        <strong>
                          {member.name}
                        </strong>

                        <span className="member-id">
                          {member.memberId}
                        </span>

                      </div>


                      <div>
                        {member.phone}
                      </div>


                      <div>
                        {member.membership}
                      </div>


                      <div className={getStatusInfo(member).className}>
                        {getStatusInfo(member).label}
                      </div>

                      <div className="member-hover-card">
                        <div className="member-hover-top">
                          <div className="member-hover-avatar">
                            {member.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong>{member.name}</strong>
                            <span>{member.memberId}</span>
                          </div>
                        </div>

                        <div className="member-hover-divider" />

                        <div className="member-hover-detail">
                          <span>PHONE</span>
                          <strong>{member.phone}</strong>
                        </div>
                        <div className="member-hover-detail">
                          <span>MEMBERSHIP</span>
                          <strong>{member.membership}</strong>
                        </div>
                        <div className="member-hover-detail">
                          <span>STATUS</span>
                          <strong className={getStatusInfo(member).className}>
                            {getStatusInfo(member).label}
                          </strong>
                        </div>

                        <div className="member-hover-hint">Click to open full profile</div>
                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </section>

        </main>

      </div>
    );
  }

  // =====================================================
  // ATTENDANCE PAGE
  // =====================================================

  if (page === "attendance") {
    return (
      <div className="app">
        <Sidebar />

        <main className="main">
          <div className="header">
            <div>
              <p>MANAGEMENT</p>
              <h1>Attendance</h1>
            </div>

            <button
              className="view-members-button"
              onClick={loadAttendance}
              disabled={attendanceLoading}
            >
              {attendanceLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="stats">
            <div className="card">
              <div className="card-title">
                Today's Entries
              </div>

              <div className="card-number">
                {todayAttendance.length}
              </div>
            </div>

            <div className="card">
              <div className="card-title">
                Currently Inside
              </div>

              <div className="card-number">
                {currentlyInside.length}
              </div>
            </div>
          </div>

          <section className="activity">
            <div className="members-page-header">
              <div>
                <h2>Today's Activity</h2>
                <p className="section-subtitle">
                  Live attendance from the biometric scanner
                </p>
              </div>

              <span>
                {todayAttendance.length} entries
              </span>
            </div>

            {todayAttendance.length === 0 ? (
              <div className="empty-members">
                <p>
                  No attendance recorded today.
                </p>
              </div>
            ) : (
              <div className="table">
                <div className="table-header">
                  <div>MEMBER</div>
                  <div>CHECK-IN</div>
                  <div>CHECK-OUT</div>
                  <div>STATUS</div>
                </div>

                {todayAttendance.map((record) => (
                  <div
                    className="member-row"
                    key={record._id}
                  >
                    <div>
                      <strong>{record.name}</strong>

                      <span className="member-id">
                        {record.memberId}
                      </span>
                    </div>

                    <div>
                      {record.checkIn
                        ? new Date(
                            record.checkIn
                          ).toLocaleTimeString(
                            "en-IN",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "—"}
                    </div>

                    <div>
                      {record.checkOut
                        ? new Date(
                            record.checkOut
                          ).toLocaleTimeString(
                            "en-IN",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "—"}
                    </div>

                    <div
                      className={
                        record.checkOut
                          ? "status-paid"
                          : "status-due"
                      }
                    >
                      {record.checkOut
                        ? "CHECKED OUT"
                        : "INSIDE"}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="total-entries">
              <span>TOTAL ENTRIES TODAY</span>

              <strong>
                {todayAttendance.length}
              </strong>
            </div>
          </section>

          <section className="activity">
            <div className="members-page-header">
              <div>
                <h2>Currently Inside</h2>
                <p className="section-subtitle">
                  Members who have checked in and not checked out
                </p>
              </div>

              <span>
                {currentlyInside.length} inside
              </span>
            </div>

            {currentlyInside.length === 0 ? (
              <div className="empty-members">
                <p>No members are currently inside.</p>
              </div>
            ) : (
              <div className="table">
                <div className="table-header">
                  <div>MEMBER</div>
                  <div>CHECK-IN</div>
                  <div>MEMBER ID</div>
                </div>

                {currentlyInside.map((record) => (
                  <div
                    className="member-row"
                    key={record._id}
                  >
                    <div>
                      <strong>{record.name}</strong>
                    </div>

                    <div>
                      {record.checkIn
                        ? new Date(
                            record.checkIn
                          ).toLocaleTimeString(
                            "en-IN",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "—"}
                    </div>

                    <div>
                      {record.memberId}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  // =====================================================
  // DASHBOARD
  // =====================================================

  return (
    <div className="app">

      <Sidebar />

      <main className="main">

        {/* DASHBOARD HERO */}
        <section className="dashboard-hero">
          <div className="dashboard-hero-bg" />

          <div className="dashboard-hero-content">
            <div className="dashboard-hero-kicker">
              SILELAN <span>•</span> OWNER CONSOLE
            </div>

            <h1 className="dashboard-hero-title">
              RUN YOUR GYM.
              <span>BUILD YOUR COMMUNITY.</span>
            </h1>

            <p className="dashboard-hero-subtitle">
              Real-time memberships, payments and attendance — all in one place.
            </p>

            <div className="dashboard-hero-actions">
              <button
                className="dashboard-hero-button"
                onClick={() => setPage("new-member")}
              >
                + New Member
              </button>

              <div className="dashboard-hero-live">
                <span className="dashboard-live-dot" />
                <div>
                  <strong>LIVE GYM DATA</strong>
                  <small>24 / 7 SYSTEM ONLINE</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DASHBOARD HEADER */}
        <div className="dashboard-section-heading">
          <div>
            <p>OVERVIEW</p>
            <h2>Good evening, Ronak.</h2>
          </div>
        </div>

        <div className="stats dashboard-stats">

          <div className="card dashboard-stat-card">
            <div className="dashboard-stat-top">
              <div className="card-title">Total Members</div>
              <span className="dashboard-stat-icon">01</span>
            </div>

            <div className="card-number">
              {members.length}
            </div>

            <div className="dashboard-stat-caption">
              Registered members
            </div>
          </div>


          <div className="card dashboard-stat-card">
            <div className="dashboard-stat-top">
              <div className="card-title">Today's Entries</div>
              <span className="dashboard-stat-icon">02</span>
            </div>

            <div className="card-number">
              {todayAttendance.length}
            </div>

            <div className="dashboard-stat-caption">
              Entries recorded today
            </div>
          </div>


          <div className="card dashboard-stat-card">
            <div className="dashboard-stat-top">
              <div className="card-title">Currently Inside</div>
              <span className="dashboard-stat-icon live">03</span>
            </div>

            <div className="card-number">
              {currentlyInside.length}
            </div>

            <div className="dashboard-stat-caption">
              Members on the floor
            </div>
          </div>


          <div className="card dashboard-stat-card dashboard-stat-due">
            <div className="dashboard-stat-top">
              <div className="card-title">Payment Due</div>
              <span className="dashboard-stat-icon alert">04</span>
            </div>

            <div className="card-number">
              {paymentDueMembers.length}
            </div>

            <div className="dashboard-stat-caption">
              Members with pending dues
            </div>
          </div>

        </div>


        <div className="dashboard-lower-grid">

          <div className="dashboard-main-column">

            {members.length > 0 && (

              <section className="activity dashboard-panel">

                <div className="members-page-header">

                  <div>
                    <h2>Members</h2>
                    <p className="section-subtitle">
                      Recently registered members
                    </p>
                  </div>

                  <button
                    className="view-members-button"
                    onClick={() => setPage("members")}
                  >
                    View All
                  </button>

                </div>

                <div className="table">

                  <div className="table-header">
                    <div>MEMBER</div>
                    <div>PHONE</div>
                    <div>MEMBERSHIP</div>
                    <div>STATUS</div>
                  </div>

                  {members
                    .slice(0, 5)
                    .map((member) => (

                      <div
                        className="member-row clickable-row"
                        key={member._id}
                        onClick={() => openMemberProfile(member)}
                      >

                        <div>
                          <strong>{member.name}</strong>
                          <span className="member-id">
                            {member.memberId}
                          </span>
                        </div>

                        <div>{member.phone}</div>
                        <div>{member.membership}</div>

                        <div className={getStatusInfo(member).className}>
                          {getStatusInfo(member).label}
                        </div>

                        <div className="member-hover-card">
                          <div className="member-hover-top">
                            <div className="member-hover-avatar">
                              {member.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <strong>{member.name}</strong>
                              <span>{member.memberId}</span>
                            </div>
                          </div>

                          <div className="member-hover-divider" />

                          <div className="member-hover-detail">
                            <span>PHONE</span>
                            <strong>{member.phone}</strong>
                          </div>
                          <div className="member-hover-detail">
                            <span>MEMBERSHIP</span>
                            <strong>{member.membership}</strong>
                          </div>
                          <div className="member-hover-detail">
                            <span>STATUS</span>
                            <strong className={getStatusInfo(member).className}>
                              {getStatusInfo(member).label}
                            </strong>
                          </div>

                          <div className="member-hover-hint">Click to open full profile</div>
                        </div>

                      </div>

                    ))}

                </div>

              </section>

            )}

            <section className="activity dashboard-panel">

              <div className="members-page-header">

                <div>
                  <h2>Today's Activity</h2>
                  <p className="section-subtitle">
                    Recent check-ins and check-outs
                  </p>
                </div>

                <button
                  className="view-members-button"
                  onClick={() => setPage("attendance")}
                >
                  Attendance
                </button>

              </div>

              <div className="table">

                <div className="table-header">
                  <div>MEMBER</div>
                  <div>CHECK-IN</div>
                  <div>CHECK-OUT</div>
                  <div>STATUS</div>
                </div>

                {todayAttendance.length === 0 ? (

                  <div className="empty-members">
                    <p>No attendance recorded today.</p>
                  </div>

                ) : (

                  todayAttendance
                    .slice(0, 5)
                    .map((record) => (

                      <div
                        className="member-row"
                        key={record._id}
                      >

                        <div>
                          <strong>{record.name}</strong>
                          <span className="member-id">
                            {record.memberId}
                          </span>
                        </div>

                        <div>
                          {record.checkIn
                            ? new Date(record.checkIn).toLocaleTimeString(
                                "en-IN",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : "—"}
                        </div>

                        <div>
                          {record.checkOut
                            ? new Date(record.checkOut).toLocaleTimeString(
                                "en-IN",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : "—"}
                        </div>

                        <div
                          className={
                            record.checkOut
                              ? "status-paid"
                              : "status-inside"
                          }
                        >
                          {record.checkOut
                            ? "CHECKED OUT"
                            : "INSIDE"}
                        </div>

                      </div>

                    ))

                )}

              </div>

              <div className="total-entries">
                <span>TOTAL ENTRIES TODAY</span>

                <strong>
                  {todayAttendance.length}
                </strong>
              </div>

            </section>

          </div>



        </div>


      </main>

    </div>
  );
}

export default App;

