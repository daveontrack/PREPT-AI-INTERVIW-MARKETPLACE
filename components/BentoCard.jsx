import React from "react";

const BentoCard = ({ icon, title, desc, children, className = "" }) => {
  return (
    <div
      className={`relative group bg-muted/30 backdrop-blur-xl border border-border hover:border-amber-400/25 rounded-2xl p-9 h-full transition-all duration-300 overflow-hidden shadow-[0_4px_40px_-12px_rgba(0,0,0,0.5)] hover:shadow-[0_4px_60px_-12px_rgba(251,191,36,0.12)] ${className}`}
    >
      <div className='absolute inset-0 bg-linear-to-br from-amber-400/[0.07] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none' />
      <div className='absolute -top-24 -right-24 w-48 h-48 bg-amber-400/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none' />

      <span className='w-11 h-11 rounded-xl bg-muted/50 backdrop-blur-md border border-border flex items-center justify-center text-xl mb-5 group-hover:border-amber-400/20 group-hover:bg-amber-400/10 transition-all duration-300'>
        {icon}
      </span>

      <h3 className='font-serif text-xl tracking-tight mb-2'>{title}</h3>

      <p className='text-sm text-muted-foreground leading-relaxed'>{desc}</p>

      {children}
    </div>
  )
};

export default BentoCard;
