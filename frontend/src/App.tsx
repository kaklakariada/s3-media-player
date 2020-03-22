import React from 'react';
import { withAuthenticator } from "aws-amplify-react";
import './App.css';
import S3BucketList from './components/S3BucketList';

function App() {
  return (
    <div className="App">
      <S3BucketList />
    </div>
  );
}

const AuthenticatedApp = withAuthenticator(App, false);

export default AuthenticatedApp;
