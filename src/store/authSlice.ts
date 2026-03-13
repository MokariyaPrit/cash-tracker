import { createSlice } from "@reduxjs/toolkit";

interface AuthState {
  user: any;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
      state.loading = false;
    },
    clearUser(state) {
      state.user = null;
      state.loading = false;
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;

export default authSlice.reducer;