import react from 'react'
import { Route,Routes } from 'react-router-dom'
import Login from './pages/Login'
import Login from './pages/Feed'
import Login from './pages/Messages'
import Login from './pages/Connections'
import Login from './pages/Profile'
import Login from './pages/CreatePost'


const App = () => {

    return (
        <>
        <Routes>
            <Route path ='/' element={<Login/>}>
            <Route index element={<Feed/>}/>
            <Route path='messages' element={<Messages/>}/>
            <Route path='messages/:userId' element={<Chatbox/>}/>
             <Route path='connections' element={<Connections/>}/>
             <Route path='discover' element={<Discover/>}/>
             <Route path='profile' element={<Profile/>}/>
            <Route path='profile/:profileId' element={<Profile/>}/>
             <Route path='create-post' element={<CreatePost/>}/>
            
            </Route>
        </Routes>
        </>
    )}

export default App