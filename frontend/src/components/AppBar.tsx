import AccountCircle from "@mui/icons-material/AccountCircle";
import MenuIcon from "@mui/icons-material/Menu";
import MuiAppBar from "@mui/material/AppBar";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import makeStyles from '@mui/styles/makeStyles';
import { CognitoUser } from "amazon-cognito-identity-js";
import React, { useEffect, useState } from "react";
import { AuthService } from "../services/AuthService";

const useStyles = makeStyles(_theme => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    // marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
  button: {
    textTransform: "none"
  },
}));

const authService = new AuthService();

const AppBar: React.FC<unknown> = () => {

  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);
  const [user, setUser] = useState<CognitoUser | undefined>(undefined);
  const open = Boolean(anchorEl);

  useEffect(() => {
    (async function () {
      try {
        const currentUser = await authService.currentAuthenticatedUser();
        setUser(currentUser);
      } catch (error) {
        console.warn("Error getting current user", error);
      }
    })();
  }, []);

  const handleMenu = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleLogout = () => {
    handleClose();
    authService.signOut();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div className={classes.root}>
      <MuiAppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            className={classes.menuButton}
            color="inherit"
            aria-label="menu"
            size="large">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" className={classes.title}>
            S3 Media Player
          </Typography>
          <div>
            <Button
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
              endIcon={<AccountCircle />}
            >
              {user ? user.getUsername() : '?'}
            </Button>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={open}
              onClose={handleClose}
            >
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </MuiAppBar>
    </div>
  );
}

export default AppBar;
