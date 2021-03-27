import React from 'react';
import { AmplifyAuthenticator } from '@aws-amplify/ui-react';
import { createMuiTheme, makeStyles, MuiThemeProvider } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import { HashRouter as Router, Route, Switch, useLocation } from "react-router-dom";
import './App.css';
import MediaList from './components/MediaList';
import { MusicPlayerProvider } from './context/MusicPlayerContext';
import PlayerControls from './components/AudioPlayer';
import environment from './environment'
import AppBar from './components/AppBar';
import { Box } from '@material-ui/core';

const RouterChild: React.FC = () => {
  let { pathname } = useLocation();
  const { path, time } = parsePath(pathname);
  return (<MediaList bucket={environment.mediaBucket} path={path} time={time} />);
}

function parsePath(pathname: string) {
  let path = pathname.startsWith('/') ? pathname.substr(1) : pathname;
  const matcher = path.match(/\/?([^&]+)(&time=(\d+))?/);
  if (!matcher) {
    console.warn(`Error parsing path '${pathname}'`);
    return { path: '/' };
  }
  const time = matcher[3] ? parseFloat(matcher[3]) : undefined;
  return { path: matcher[1], time };
}

const useStyles = makeStyles(theme => ({
  authenticator: {
    'text-align': 'center'
  },
  body: {
    'text-align': 'left'
  },
  player: {
    'margin': '5px'
  },
}));

const theme = createMuiTheme({
  typography: {
    button: {
      textTransform: "none"
    }
  }
});

function App() {
  const classes = useStyles();
  return (
    <React.StrictMode>
      <MuiThemeProvider theme={theme}>
        <AmplifyAuthenticator usernameAlias="username" className={classes.authenticator}>
          <Box className={classes.body}>
            <CssBaseline />
            <MusicPlayerProvider>
              <Router>
                <AppBar />
                <Box className={classes.player}>
                  <PlayerControls />
                </Box>
                <Switch>
                  <Route exact path="/">
                    <MediaList bucket={environment.mediaBucket} path="" />
                  </Route>
                  <Route path="/:path&time=:time" children={<RouterChild />} />
                  <Route path="/:path" children={<RouterChild />} />
                </Switch>
              </Router>
            </MusicPlayerProvider>
          </Box>
        </AmplifyAuthenticator>
      </MuiThemeProvider>
    </React.StrictMode>
  );
}

export default App;
