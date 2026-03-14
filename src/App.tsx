import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAppDispatch } from "./hooks/reduxHooks";
import { setUser, clearUser } from "./store/authSlice";
import { listenAuthState } from "./services/authService";
import routes from "./routes/routes";
import "./App.css";
function renderRoutes(routes: any[]) {
  return routes.map((route, index) => (
    <Route key={index} path={route.path} element={route.element}>
      {route.children && renderRoutes(route.children)}
    </Route>
  ));
}

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubscribe = listenAuthState((user: any) => {
      if (user) {
        dispatch(
          setUser({
            uid: user.uid,
            email: user.email,
          }),
        );
      } else {
        dispatch(clearUser());
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>{renderRoutes(routes)}</Routes>
    </BrowserRouter>
  );
}

export default App;
