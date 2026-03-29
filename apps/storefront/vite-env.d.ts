/// <reference types="vite/client" />

/**
 * Type declarations for Vite-specific imports
 */

// CSS modules with ?url suffix
declare module '*.css?url' {
  const url: string;
  export default url;
}

// CSS modules
declare module '*.css' {
  const content: string;
  export default content;
}

// Images with ?url suffix
declare module '*.svg?url' {
  const url: string;
  export default url;
}

declare module '*.png?url' {
  const url: string;
  export default url;
}

declare module '*.jpg?url' {
  const url: string;
  export default url;
}

declare module '*.jpeg?url' {
  const url: string;
  export default url;
}

declare module '*.gif?url' {
  const url: string;
  export default url;
}

declare module '*.webp?url' {
  const url: string;
  export default url;
}
