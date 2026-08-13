/* eslint-disable react/prop-types */
import { createContext, useState, useEffect, useContext, useRef } from "react";
import { useAuthContext } from "./AuthContext";
import io from "socket.io-client";

const SocketContext = createContext();

// Point at our own backend. Override with VITE_SOCKET_URL for deployed builds.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

// eslint-disable-next-line react-refresh/only-export-components
export const useSocketContext = () => {
	return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
	const [socket, setSocket] = useState(null);
	const [onlineUsers, setOnlineUsers] = useState([]);
	const { authUser } = useAuthContext();

	// Held in a ref so the effect never has to depend on the socket it creates.
	const socketRef = useRef(null);

	useEffect(() => {
		if (!authUser?._id) {
			socketRef.current?.close();
			socketRef.current = null;
			setSocket(null);
			setOnlineUsers([]);
			return;
		}

		const s = io(SOCKET_URL, {
			query: { userId: authUser._id },
		});

		socketRef.current = s;
		setSocket(s);

		s.on("getOnlineUsers", (users) => {
			setOnlineUsers(users);
		});

		return () => {
			s.close();
			socketRef.current = null;
		};
		// Depends only on the user id: depending on `socket` here re-triggers the
		// effect that sets it, which spins into an infinite connect/close loop.
	}, [authUser?._id]);

	return <SocketContext.Provider value={{ socket, onlineUsers }}>{children}</SocketContext.Provider>;
};
