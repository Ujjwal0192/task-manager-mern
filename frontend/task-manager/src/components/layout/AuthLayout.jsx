// import React from 'react'
// import UI_IMG from '../../assets/images/loginPageImage.jpg';
// const AuthLayout = ({children}) => {
//   return (
//     <div className='flex'>
//        <div className='w-screen h-screen md:w-[60vh] px-12 pt-8 pb-12'>
//         <h2 className='text-lg font-medium text-black'>Task Manager</h2>
//         {children}
//         </div>

//         <div className='hidden md:block w-[40vw] h-screen items-center bg-blue-50  bg-cover bg-no-repeat bg-center overflow-hidden p-8'>
//             <img src={UI_IMG} alt="UI_IMG" className='w-64 lg:w-[90%]' />
//         </div>
//     </div>
//   )
// }

// export default AuthLayout



import React from "react";
import UI_IMG from "../../assets/images/loginPageImage.jpg";

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left / Image + Branding (hidden on small screens) */}
      <div className="hidden md:flex w-1/2 relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-linear-to-br from-blue-600 via-indigo-600 to-sky-500" />

        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-10 h-64 w-64 rounded-full bg-sky-300/20 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between w-full p-10 lg:p-12 text-white">
          {/* Brand */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Task Manager
            </div>

            <h1 className="mt-6 text-3xl lg:text-4xl font-semibold leading-tight">
              Stay on top of your{" "}
              <span className="font-bold">tasks & deadlines.</span>
            </h1>
            <p className="mt-3 text-sm lg:text-base text-blue-100/90 max-w-md">
              Organize, prioritize, and track progress in one clean dashboard.
              Collaborate with your team and never miss what matters.
            </p>
          </div>

          {/* Image / Illustration */}
          <div className="mt-8 flex justify-center lg:justify-end">
            <div className="relative max-w-md w-full">
              <div className="absolute -inset-4 rounded-3xl bg-black/10 blur-2xl" />
              <img
                src={UI_IMG}
                alt="Task Manager preview"
                className="relative rounded-3xl shadow-2xl w-full border border-white/20 object-cover"
              />
            </div>
          </div>

          {/* Bottom small text */}
          <p className="mt-6 text-[11px] text-blue-100/80">
            Boost your productivity with smart checklists, progress tracking,
            and team assignments.
          </p>
        </div>
      </div>

      {/* Right / Auth card */}
      <div className="flex w-full md:w-1/2 items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          {/* Brand on mobile */}
          <div className="mb-6 flex items-center justify-between md:justify-start md:gap-3">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <span className="text-sm font-semibold text-slate-900">
                Task Manager
              </span>
            </div>
            <span className="md:hidden text-xs text-slate-500">
              Stay organized, every day.
            </span>
          </div>

          {/* Card */}
          <div className="rounded-2xl bg-white/90 shadow-xl border border-slate-100 backdrop-blur p-6 sm:p-8">
            {/* Optional heading area for login / signup pages */}
            {/* You can remove this if your child already has its own heading */}
            { 
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900">
                Welcome back 👋
              </h2>
            </div>
            }

            {children}
          </div>

          {/* Footer small text */}
          <p className="mt-6 text-xs text-center text-slate-400">
            © {new Date().getFullYear()} Task Manager. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
 



// import React, { useEffect, useState } from "react";
// import UI_IMG from "../../assets/images/loginPageImage.jpg";

// const getAverageColor = (img) => {
//   const canvas = document.createElement("canvas");
//   const ctx = canvas.getContext("2d");
//   canvas.width = img.width;
//   canvas.height = img.height;
//   ctx.drawImage(img, 0, 0);

//   const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
//   let r = 0, g = 0, b = 0, count = 0;

//   for (let i = 0; i < data.length; i += 4) {
//     r += data[i];
//     g += data[i + 1];
//     b += data[i + 2];
//     count++;
//   }

//   return {
//     r: Math.round(r / count),
//     g: Math.round(g / count),
//     b: Math.round(b / count),
//   };
// };

// const AuthLayout = ({ children }) => {
//   const [themeColor, setThemeColor] = useState("59 130 246");

//   useEffect(() => {
//     const img = new Image();
//     img.src = UI_IMG;
//     img.crossOrigin = "Anonymous";

//     img.onload = () => {
//       const { r, g, b } = getAverageColor(img);
//       setThemeColor(`${r} ${g} ${b}`);
//     };
//   }, []);

//   return (
//     <div
//       className="min-h-screen flex items-center justify-center bg-cover bg-center"
//       style={{
//         backgroundImage: `url(${UI_IMG})`,
//       }}
//     >
//       {/* Overlay for readability */}
//       <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

//       <div
//         className="relative w-full max-w-md p-8 rounded-2xl shadow-2xl bg-white/90 backdrop-blur-lg"
//         style={{
//           borderColor: `rgb(${themeColor})`,
//         }}
//       >
//         <h2
//           className="text-2xl font-bold text-center mb-6"
//           style={{ color: `rgb(${themeColor})` }}
//         >
//           Task Manager
//         </h2>

//         {/* Dynamic accent line */}
//         <div
//           className="h-1 w-16 mx-auto rounded-full mb-6"
//           style={{ backgroundColor: `rgb(${themeColor})` }}
//         />

//         {children}

//         {/* Example dynamic button style */}
//         <button
//           className="mt-6 w-full py-2 rounded-lg font-semibold text-white transition hover:brightness-110"
//           style={{ backgroundColor: `rgb(${themeColor})` }}
//         >
//           Continue
//         </button>
//       </div>
//     </div>
//   );
// };

// export default AuthLayout;



