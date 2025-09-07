import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api'

export default function Signup() {
  const nav = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await API.signup({ username, password })
      if (res.token) {
        localStorage.setItem('token', res.token)
        localStorage.setItem('username', res.user.username)
        nav('/')
      } else {
        alert(res.error || 'Signup failed')
      }
    } catch (err) {
      console.error(err)
      alert('Signup error')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <h2>Signup</h2>
      <div className="card form">
        <form onSubmit={submit}>
          <label>Choose username</label>
          <input className="input" value={username} onChange={e=>setUsername(e.target.value)} required />
          <label>Choose password</label>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          <div style={{display:'flex', gap:10, marginTop:8}}>
            <button className="button" type="submit">{loading ? 'Creating…' : 'Signup'}</button>
            <button type="button" className="button secondary" onClick={()=>{ setUsername(''); setPassword('') }}>Clear</button>
          </div>
        </form>
      </div>
    </div>
  )
}
