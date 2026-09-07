import { useState } from "react";
import { Link } from "react-router-dom";	
import useLogin from "../../hooks/useLogin";	
// Seeded by backend/seeds/createDemoUser.js.
const DEMO_USERNAME = "demo";
const DEMO_PASSWORD = "demo1234";

const Login = () => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");

	const { loading, login } = useLogin();

	const handleSubmit = async (e) => {
		e.preventDefault();
		await login(username, password);
	};

	// Lets a visitor look around without creating an account first.
	const handleDemo = async () => {
		setUsername(DEMO_USERNAME);
		setPassword(DEMO_PASSWORD);
		await login(DEMO_USERNAME, DEMO_PASSWORD);
	};

	return (
		<div className='flex flex-col items-center justify-center min-w-96 mx-auto'>
			<div className='w-full p-6 rounded-lg shadow-md bg-gray-400 bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-0'>
				<h1 className='text-3xl font-semibold text-center text-gray-300'>
					Login
					<span className='text-blue-500'> ChatApp</span>
				</h1>

				<form onSubmit={handleSubmit}>
					<div>
						<label className='label p-2'>
							<span className='text-base label-text'>Username</span>
						</label>
						<input
							type='text'
							placeholder='Enter username'
							className='w-full input input-bordered h-10'
							value={username}
							onChange={(e) => setUsername(e.target.value)}
						/>
					</div>

					<div>
						<label className='label'>
							<span className='text-base label-text'>Password</span>
						</label>
						<input
							type='password'
							placeholder='Enter Password'
							className='w-full input input-bordered h-10'
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
					</div>
					<Link to='/signup' className='text-sm  hover:underline hover:text-blue-600 mt-2 inline-block'>
						{"Don't"} have an account?
					</Link>

					<div>
						<button className='btn btn-block btn-sm mt-2' disabled={loading}>
							{loading ? <span className='loading loading-spinner '></span> : "Login"}
						</button>
					</div>
				</form>

				<div className='divider text-xs text-gray-400 my-3'>or</div>

				<button
					type='button'
					onClick={handleDemo}
					disabled={loading}
					className='btn btn-block btn-sm btn-outline'
				>
					Try the demo
				</button>
				<p className='text-xs text-center text-gray-400 mt-2'>
					Signs you in as @{DEMO_USERNAME} — no signup needed.
				</p>
			</div>
		</div>
	);
};
export default Login;
