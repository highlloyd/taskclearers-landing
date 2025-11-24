import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const Logo = () => (
  <Link href="/" className="flex items-center gap-2 font-bold text-xl md:text-2xl tracking-tight text-gray-900 cursor-pointer select-none">
    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
      <CheckCircle2 className="w-5 h-5 text-green-600" />
    </div>
    <span>TaskClearers</span>
  </Link>
);

export default Logo;