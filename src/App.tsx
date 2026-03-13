import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAppDispatch } from "./hooks/reduxHooks";
import { setUser, clearUser } from "./store/authSlice";
import { listenAuthState } from "./services/authService";
import routes from "./routes/routes";

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubscribe = listenAuthState((user: any) => {
      if (user) {
        dispatch(setUser(user));
      } else {
        dispatch(clearUser());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        {routes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element} />
        ))}
      </Routes>
    </BrowserRouter>
  );
}

export default App;