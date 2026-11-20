import React from 'react';

export const Skeleton = ({
  className = '',
  height = 'h-4',
  width = 'w-full',
  rounded = 'rounded-[16px]',
}) => {
  return (
    <div
      className={`bg-slate-100/90 animate-pulse ${rounded} ${height} ${width} ${className}`}
    />
  );
};

export const CardSkeleton = () => {
  return (
    <div className="bg-white rounded-[32px] p-6 shadow-card space-y-4">
      <Skeleton height="h-44" rounded="rounded-[24px]" />
      <Skeleton height="h-6" width="w-3/4" />
      <Skeleton height="h-4" width="w-1/2" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton height="h-5" width="w-24" />
        <Skeleton height="h-9" width="w-24" rounded="rounded-[16px]" />
      </div>
    </div>
  );
};

export default Skeleton;
