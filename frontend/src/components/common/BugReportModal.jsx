// components/BugReportModal.jsx
import React, { useState } from "react";
import emailjs from "@emailjs/browser";

export default function BugReportModal({ onClose }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const sendReport = async () => {
    try {
      await emailjs.send(
        "zayna_bugReport",
        "zayna_bugReport",
        form,
        "nijiwPUpkGktDozw9"
      );

      alert("گزارش ارسال شد ✅");
      onClose();
    } catch (err) {
      console.error(err);
      alert("خطا در ارسال ❌");
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3>گزارش باگ</h3>

        <input
          name="name"
          placeholder="نام"
          onChange={handleChange}
        />

        <input
          name="email"
          placeholder="ایمیل"
          onChange={handleChange}
        />

        <textarea
          name="message"
          placeholder="توضیح مشکل..."
          onChange={handleChange}
        />

        <div style={styles.actions}>
          <button onClick={sendReport}>ارسال</button>
          <button onClick={onClose}>بستن</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    width: "300px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  actions: {
    display: "flex",
    justifyContent: "space-between",
  },
};