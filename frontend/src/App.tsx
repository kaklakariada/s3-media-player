import React from 'react';
import { withAuthenticator } from "aws-amplify-react";
import './App.css';
import MediaList from './components/MediaList';

function App() {
  return (
    <div className="App">
      <MediaList />
    </div>
  );
}

const AuthenticatedApp = withAuthenticator(App, false);

export default AuthenticatedApp;
