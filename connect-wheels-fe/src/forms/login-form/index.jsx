import { Formik, Form } from "formik";
import { LoginFormFields } from "./login-fields";
import { schema } from "../../validations";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useEffect } from "react";
import { useLoginUserMutation } from "../../redux/slices/apiSlice";
import { loginSuccess, setError } from "../../redux/slices/userSlice";

const initialValues = {
  email: "",
  password: "",
};

export const LoginForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loginUser, { isLoading, error }] = useLoginUserMutation();

  // Show toast when there's an error
  useEffect(() => {
    if (error) {
      const rawMessage = error?.data?.message || error?.message || "Login failed";
      const errorMessage = rawMessage.includes("Email not verified")
        ? "Your email is not verified. Please check your inbox or spam folder."
        : rawMessage;
      toast.error(errorMessage);
      dispatch(setError(errorMessage));
    }
  }, [error, dispatch]);

  const handleSubmit = async (values, { resetForm }) => {
    try {
      const result = await loginUser(values).unwrap();
      
      // Handle successful login
      if (result.token) {
        dispatch(loginSuccess(result));
        resetForm();
        navigate("/dashboard");
        toast.success("Login successful!");
      } else {
        throw new Error("No token received");
      }
    } catch (err) {
      // Error is already handled by the useEffect above
      console.error("Login error:", err);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={schema}
      onSubmit={handleSubmit}
    >
      <Form>
        <LoginFormFields loading={isLoading} />
      </Form>
    </Formik>
  );
};
