"use client";

import React from "react";

/** Design's crumb(...) — خانه › a › b */
export function Crumb({ parts }: { parts: React.ReactNode[] }) {
  return (
    <div className="w">
      <div className="crumb">
        <a href="#home">خانه</a>
        {" › "}
        {parts.map((p, i) => (
          <React.Fragment key={i}>
            {i > 0 && " › "}
            {p}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
