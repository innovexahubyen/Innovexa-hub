import { supabase } from './lib/supabase.js'

// ═══════════════════ MEMBERS / PROFILES ═══════════════════

export async function getMembers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getMember(id) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createMember(member) {
  // First create auth user, then profile
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: member.email,
    password: member.password || 'Welcome@123',
    options: {
      data: { name: member.name }
    }
  })
  if (authError) throw authError

  // Upsert profile
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: authData.user.id,
      name: member.name,
      email: member.email,
      phone_number: member.phone_number,
      ticket_no: member.ticket_no,
      date_of_joining: member.date_of_joining || new Date().toISOString().split('T')[0],
      role: member.role || 'member'
    })
    .select()
  if (error) throw error
  return data
}

export async function updateMember(id, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
  if (error) throw error
  return data
}

export async function deleteMember(id) {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ═══════════════════ EVENTS ═══════════════════

export async function getEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createEvent(event) {
  const { data, error } = await supabase
    .from('events')
    .insert(event)
    .select()
  if (error) throw error
  return data
}

export async function updateEvent(id, updates) {
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
  if (error) throw error
  return data
}

export async function deleteEvent(id) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ═══════════════════ POSTS ═══════════════════

export async function getPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles(name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createPost(post) {
  const { data, error } = await supabase
    .from('posts')
    .insert(post)
    .select()
  if (error) throw error
  return data
}

export async function updatePost(id, updates) {
  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', id)
    .select()
  if (error) throw error
  return data
}

export async function deletePost(id) {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ═══════════════════ ANNOUNCEMENTS ═══════════════════

export async function getAnnouncements() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createAnnouncement(announcement) {
  const { data, error } = await supabase
    .from('announcements')
    .insert(announcement)
    .select()
  if (error) throw error
  return data
}

export async function updateAnnouncement(id, updates) {
  const { data, error } = await supabase
    .from('announcements')
    .update(updates)
    .eq('id', id)
    .select()
  if (error) throw error
  return data
}

export async function deleteAnnouncement(id) {
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ═══════════════════ MESSAGES (CHAT) ═══════════════════

export async function getMessages(limit = 50) {
  const { data, error } = await supabase
    .from('messages')
    .select('id, content, created_at, sender_id, profiles(name, role)')
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  // Return in chronological order
  return (data || []).reverse()
}

export async function createMessage(content, senderId) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ content, sender_id: senderId })
    .select()
  if (error) throw error
  return data[0]
}
