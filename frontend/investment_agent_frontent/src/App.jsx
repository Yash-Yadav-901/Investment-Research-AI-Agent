import Sidebar from './components/toolsAndOptions/SideBar';


const App = () => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-4">
        {/* Main content goes here */}
      </div>
    </div>
  );
}

export default App;