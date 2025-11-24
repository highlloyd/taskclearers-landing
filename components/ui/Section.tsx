import React from 'react';

const Section = ({ children, className = "", id = "" }: any) => (
  <section id={id} className={`py-16 md:py-24 ${className}`}>
    {children}
  </section>
);

export default Section;