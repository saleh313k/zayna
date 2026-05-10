// // src/pages/Dashboard.jsx
// import { Routes, Route } from 'react-router-dom';
// import { useAuth } from '../hooks/useAuth';
// import CustomerDashboard from '../components/customer/CustomerDashboard';
// import SalonDashboard from '../components/salon/SalonDashboard';
// import StylistDashboard from '../components/stylist/StylistDashboard';
// import AdminDashboard from '../components/admin/AdminDashboard';
// import Sidebar from '../components/common/Sidebar';

// export default function Dashboard() {
//   const { user } = useAuth();

//   const getDashboardComponent = () => {
//     switch (user?.role) {
//       case 3:
//         return <CustomerDashboard />;
//       case 1:
//         return <SalonDashboard />;
//       case 2:
//         return <StylistDashboard />;
//       case 0:
//         return <AdminDashboard />;
//       default:
//         return <div>Unknown role</div>;
//     }
//   };

//   return (
//     <div className="flex min-h-screen bg-cream-white ">
//       <Sidebar />
//       <main className="flex-1 p-6 ">
//         <Routes>
//           <Route path="/" element={getDashboardComponent()} />
//         </Routes>
//       </main>
//     </div>
//   );
// }
