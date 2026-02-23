import React from "react";
import type { Route } from "./+types/test";

const id = ({ params }: Route.ComponentProps) => {
  return <div>id {params.id}</div>;
};

export default id;
