import { useSelector } from "react-redux";

export default function UserDebug() {
  const { user, token, isAuthenticated } = useSelector((state) => state.user);
  
  const localStorageUser = localStorage.getItem("user");
  const localStorageToken = localStorage.getItem("token");
  
  return (
    <div style={{ 
      position: "fixed", 
      bottom: 10, 
      right: 10, 
      background: "black", 
      color: "lime", 
      padding: "10px", 
      fontSize: "10px",
      maxWidth: "300px",
      zIndex: 9999,
      fontFamily: "monospace"
    }}>
      <h4 style={{margin: 0, marginBottom: "5px"}}>User Debug:</h4>
      <div>Redux User: {JSON.stringify(user)}</div>
      <div>User ID: {user?.id || "UNDEFINED"}</div>
      <div>Token: {token ? token.substring(0, 20) + "..." : "NONE"}</div>
      <div>Authenticated: {isAuthenticated ? "YES" : "NO"}</div>
      <hr style={{margin: "5px 0"}} />
      <div>localStorage user: {localStorageUser}</div>
      <div>localStorage token: {localStorageToken ? localStorageToken.substring(0, 20) + "..." : "NONE"}</div>
    </div>
  );
}

