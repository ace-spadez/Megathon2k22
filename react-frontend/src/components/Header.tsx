import React from 'react'

interface Props {
  title: string
}

const Header: React.FC<Props> = ({ title }) => {
  return (
    <header className="bg-white shadow">
    </header>
  );
};

export default Header
