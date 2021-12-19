import React from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import { createTheme, makeStyles, MuiThemeProvider } from "@material-ui/core/styles";
import CssBaseline from "@material-ui/core/CssBaseline";
import { HashRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import './App.css';
import '@aws-amplify/ui-react/styles.css';
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
  const p = matcher[1];
  if (!p) {
    throw Error("Error matching path");
  }
  return { path: p, time };
}

const useStyles = makeStyles(_theme => ({
  body: {
    'text-align': 'left'
  },
  player: {
    'margin': '5px'
  },
}));

const theme = createTheme({
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
        <Authenticator>
          {() => (
            <Box className={classes.body}>
              <CssBaseline />
              <MusicPlayerProvider>
                <Router>
                  <AppBar />
                  <Box className={classes.player}>
                    <PlayerControls />
                  </Box>
                  <Routes>
                    <Route path="/" element={<MediaList bucket={environment.mediaBucket} path="" />} />
                    <Route path="/:path&time=:time" element={<RouterChild />} />
                    <Route path="/:path" element={<RouterChild />} />
                  </Routes>
                </Router>
              </MusicPlayerProvider>
            </Box>
          )}
        </Authenticator>
      </MuiThemeProvider>
    </React.StrictMode>
  );
}

export default App;
