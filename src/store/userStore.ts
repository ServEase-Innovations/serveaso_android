import { configureStore } from '@reduxjs/toolkit';
import userReducer from '../features/userSlice.ts';
import cartReducer from '../features/cartSlice';
import bookingTypeReducer from '../features/bookingTypeSlice';
import pricingReducer from '../features/pricingSlice';
import detailsDataReducer from '../features/detailsDataSlice';

// Configure your Redux store
const store = configureStore({
  reducer: {
    user: userReducer,
    cart: cartReducer,
    bookingType: bookingTypeReducer,
    pricing: pricingReducer,
    detailsData : detailsDataReducer
  },
});

// Define RootState type by inferring it directly from the store
export type RootState = ReturnType<typeof store.getState>;

// Export the store for use in the application
export default store;