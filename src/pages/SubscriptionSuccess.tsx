import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SubscriptionSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/pricing", { replace: true });
  }, [navigate]);

  return null;
};

export default SubscriptionSuccess;
