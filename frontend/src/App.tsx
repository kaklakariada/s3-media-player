import React from 'react';
import { withAuthenticator } from "aws-amplify-react";
import './App.css';

function App() {
  return (
    <div className="App">
    </div>
  );
}

const AuthenticatedApp = withAuthenticator(App, false);

export default AuthenticatedApp;
