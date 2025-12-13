import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import Delivo from "./Delivo";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Delivo />
  </React.StrictMode>
);

serviceWorkerRegistration.register();