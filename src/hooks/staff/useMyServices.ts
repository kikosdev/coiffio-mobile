// SWAP: GET /services?staffId=me
import { useState } from 'react';
import { myServices, defaultAcceptingBookings } from '../../data/staff/services';

export function useMyServices() {
  const [acceptingBookings, setAcceptingBookings] = useState(defaultAcceptingBookings);

  function toggleAcceptingBookings() {
    // SWAP: PATCH /services/accepting-bookings { accepting: !current, staffId:me }
    setAcceptingBookings((v) => !v);
  }

  return {
    data: { services: myServices, acceptingBookings },
    isLoading: false,
    error: null,
    toggleAcceptingBookings,
  };
}
