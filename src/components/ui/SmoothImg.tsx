import React, { useState } from 'react';

/**
 * <img> that stays invisible until it has loaded, so the browser's broken-image
 * icon / alt text never flashes. If the file fails to load, it stays hidden.
 */
type Props = React.ImgHTMLAttributes<HTMLImageElement>;

const SmoothImg: React.FC<Props> = ({ className = '', onLoad, onError, ...rest }) => {
  const [ready, setReady] = useState(false);
  return (
    <img
      decoding="async"
      {...rest}
      className={`${className} transition-opacity duration-200 ${ready ? 'opacity-100' : 'opacity-0'}`}
      onLoad={(e) => { setReady(true); onLoad?.(e); }}
      onError={(e) => { setReady(false); onError?.(e); }}
    />
  );
};

export default SmoothImg;
