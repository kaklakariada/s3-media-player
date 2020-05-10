import React from 'react';
import { AmplifyAuthenticator } from '@aws-amplify/ui-react';
import { makeStyles } from "@material-ui/core/styles";
import { HashRouter as Router, Route, Switch, useLocation } from "react-router-dom";
import './App.css';
import MediaList from './components/MediaList';
import { MusicPlayerProvider } from './context/MusicPlayerContext';
import PlayerControls from './components/AudioPlayer';

const useStyles = makeStyles(theme => ({
  authenticator: {
    'text-align': 'center'
  }
}));

const RouterChild: React.FC = () => {
  let { pathname } = useLocation();
  const path = pathname.startsWith('/') ? pathname.substr(1) : pathname;
  return (<MediaList path={path} />);
}

function App() {
  const classes = useStyles();
  return (
    <AmplifyAuthenticator usernameAlias="username" className={classes.authenticator}>
      <MusicPlayerProvider>
        <Router>
          <div className="App">
            <PlayerControls />
          </div>
          <Switch>
            <Route path="/:path" children={<RouterChild />} />
          </Switch>
        </Router>
      </MusicPlayerProvider>
    </AmplifyAuthenticator>
  );
}

export default App;
