import { SVGProps } from "react";

export function VuiCoin({ size = 24, className, ...props }: SVGProps<SVGSVGElement> & { size?: number | string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Nền cam nhạt, vòng tròn mũi tên */}
      <circle cx="12" cy="12" r="10" className="fill-orange-50/50 stroke-none" />
      
      {/* Vòng cung uốn lên thành mũi tên (thể hiện sự tăng trưởng) */}
      <path d="M6 16 A 8.5 8.5 0 1 0 18 7" />
      <path d="M14 7h4v4" />

      {/* Symbol V kết hợp với cột $ chính giữa */}
      <path d="M9 10l3 4 3-4" />
      <line x1="12" y1="6" x2="12" y2="17" />
    </svg>
  );
}
