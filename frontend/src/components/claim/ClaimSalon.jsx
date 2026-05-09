// // ============================================
// // src/components/claim/ClaimSalon.jsx
// // ============================================
// import React, { useState, useEffect } from 'react';
// import { useParams } from 'react-router-dom';
// import { useTranslation } from 'react-i18next';
// import Layout from '../common/Layout';
// import { salonService } from '../../services/salonService';

// const ClaimSalon = () => {
//   const { salonId } = useParams();
//   const { t } = useTranslation();

//   const [salon, setSalon] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const [form, setForm] = useState({
//     name: '',
//     phone: '',
//     email: '',
//     message: ''
//   });

//   useEffect(() => {
//     fetchSalon();
//   }, []);

//   const fetchSalon = async () => {
//     try {
//       const data = await salonService.getPublicSalonById(salonId);
//       setSalon(data);
//     } catch (e) {
//       console.error(e);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleChange = (e) => {
//     setForm({
//       ...form,
//       [e.target.name]: e.target.value
//     });
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     const subject = `Salon Claim Request - ${salon?.name || ''}`;

//     const body = `
// Salon: ${salon?.name}
// Address: ${salon?.address}

// Owner Name: ${form.name}
// Phone: ${form.phone}
// Email: ${form.email}

// Message:
// ${form.message}
// `;

//     window.location.href =
//       `mailto:worldspringco@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
//   };

//   if (loading) {
//     return (
//       <Layout>
//         <div className="flex justify-center items-center h-64">
//           <div className="spinner"></div>
//         </div>
//       </Layout>
//     );
//   }

//   return (
//     <Layout>
//       <div className="max-w-3xl mx-auto">

//         {/* Header */}
//         <div className="card mb-6">
//           <h1 className="text-2xl font-bold text-primary mb-2">
//             {t('claim.title', 'Claim this business')}
//           </h1>

//           <p className="text-gray-600">
//             {t('claim.subtitle', 'Verify ownership and start receiving bookings')}
//           </p>
//         </div>

//         {/* Salon Info */}
//         {salon && (
//           <div className="card mb-6">
//             <h2 className="text-xl font-semibold mb-2">
//               {salon.name}
//             </h2>

//             <p className="text-gray-600 text-sm">
//               {salon.address}
//             </p>
//           </div>
//         )}

//         {/* Form */}
//         <form onSubmit={handleSubmit} className="card space-y-4">

//           <div>
//             <label className="label">
//               {t('claim.ownerName', 'Your Name')}
//             </label>

//             <input
//               name="name"
//               value={form.name}
//               onChange={handleChange}
//               required
//               className="input-field"
//             />
//           </div>

//           <div>
//             <label className="label">
//               {t('claim.phone', 'Phone')}
//             </label>

//             <input
//               name="phone"
//               value={form.phone}
//               onChange={handleChange}
//               required
//               className="input-field"
//             />
//           </div>

//           <div>
//             <label className="label">
//               {t('claim.email', 'Email')}
//             </label>

//             <input
//               name="email"
//               type="email"
//               value={form.email}
//               onChange={handleChange}
//               required
//               className="input-field"
//             />
//           </div>

//           <div>
//             <label className="label">
//               {t('claim.message', 'Message')}
//             </label>

//             <textarea
//               name="message"
//               value={form.message}
//               onChange={handleChange}
//               className="input-field"
//               rows={4}
//             />
//           </div>

//           <button
//             type="submit"
//             className="btn-primary w-full"
//           >
//             {t('claim.submit', 'Submit Claim')}
//           </button>

//         </form>

//       </div>
//     </Layout>
//   );
// };

// export default ClaimSalon;

import React, { useState } from "react";
import Layout from '../common/Layout';
// import emailjs from "@emailjs/browser";
import { FiCheckCircle } from "react-icons/fi";

const ClaimSalon = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    business: "",
    city: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      // await emailjs.send(
      //   "YOUR_SERVICE_ID",
      //   "YOUR_TEMPLATE_ID",
      //   {
      //     name: form.name,
      //     phone: form.phone,
      //     email: form.email,
      //     business: form.business,
      //     city: form.city,
      //   },
      //   "YOUR_PUBLIC_KEY"
      // );

      // setSuccess(true);

      // setForm({
      //   name: "",
      //   phone: "",
      //   email: "",
      //   business: "",
      //   city: "",
      // });
    } catch (err) {
      alert("Something went wrong. Please try again.");
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* HERO */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Grow your business with online booking
          </h1>

          <p className="text-gray-600 max-w-2xl mx-auto">
            Customers are already searching for your business. Claim it on Zayna
            and start receiving bookings, calls, and new clients today.
          </p>
        </div>

        {/* BENEFITS */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="card text-center p-6">
            <FiCheckCircle className="text-accent text-3xl mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Accept bookings 24/7</h3>
            <p className="text-gray-600 text-sm">
              Let customers book anytime without phone calls.
            </p>
          </div>

          <div className="card text-center p-6">
            <FiCheckCircle className="text-accent text-3xl mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Get more clients</h3>
            <p className="text-gray-600 text-sm">
              Increase visibility and attract new customers.
            </p>
          </div>

          <div className="card text-center p-6">
            <FiCheckCircle className="text-accent text-3xl mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Manage easily</h3>
            <p className="text-gray-600 text-sm">
              Control schedule, staff, and appointments in one place.
            </p>
          </div>
        </div>

        {/* FORM */}
        <div className="max-w-xl mx-auto">
          <div className="card p-8">
            {!success ? (
              <>
                <h2 className="text-2xl font-semibold mb-6 text-center">
                  Claim your business — it's free
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your Name"
                    className="input-field w-full"
                    required
                  />

                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Phone Number"
                    className="input-field w-full"
                    required
                  />

                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Email"
                    className="input-field w-full"
                    required
                  />

                  <input
                    name="business"
                    value={form.business}
                    onChange={handleChange}
                    placeholder="Business Name"
                    className="input-field w-full"
                    required
                  />

                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="City"
                    className="input-field w-full"
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full"
                  >
                    {loading ? "Sending..." : "Claim My Business"}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-6">
                <FiCheckCircle className="text-green-500 text-4xl mx-auto mb-3" />
                <h3 className="text-xl font-semibold mb-2">
                  Request sent successfully
                </h3>
                <p className="text-gray-600">
                  Our team will contact you soon.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ClaimSalon;