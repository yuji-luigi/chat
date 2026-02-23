import React from "react";
import { Outlet } from "react-router";

const testById = () => {
  return (
    <div>
      <h1>Test</h1>
      <Outlet />
    </div>
  );
};

export default testById;
