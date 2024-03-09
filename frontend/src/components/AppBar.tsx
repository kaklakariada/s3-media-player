import AccountCircle from "@mui/icons-material/AccountCircle";
import MenuIcon from "@mui/icons-material/Menu";
import MuiAppBar from "@mui/material/AppBar";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { styled } from '@mui/system';
import React, { useEffect, useState } from "react";
import { AuthService } from "../services/AuthService";
import { AuthUser } from "@aws-amplify/auth";

const authService = new AuthService();

const AppBar: React.FC<unknown> = () => {

  const [anchorEl, setAnchorEl] = useState<Element | null>(null);
  const [user, setUser] = useState<AuthUser | undefined>(undefined);
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

  const Root = styled('div')({
    flexGrow: 1
  })
  return (
    <Root>
      <MuiAppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            sx={{ marginRight: 2 }}
            color="inherit"
            aria-label="menu"
            size="large">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
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
              {user ? user.username : '?'}
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
    </Root>
  );
}

export default AppBar;
