package br.com.asanumaodonto.repository;
import java.util.*;
import java.sql.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
@Repository
public class ClinicRepository {
 private final JdbcTemplate jdbc; private final ObjectMapper mapper;
 public ClinicRepository(JdbcTemplate jdbc,ObjectMapper mapper){this.jdbc=jdbc;this.mapper=mapper;}
 private Map<String,Object> decode(String value){try{return mapper.readValue(value,new TypeReference<Map<String,Object>>(){});}catch(Exception e){throw new IllegalStateException(e);}}
 public List<Map<String,Object>> list(String kind){return jdbc.query("SELECT payload FROM clinic_entities WHERE kind=? ORDER BY id",(rs,n)->decode(rs.getString(1)),kind);}
 public Map<String,Object> find(String kind,String id){return list(kind).stream().filter(x->id.equals(x.get("id"))).findFirst().orElse(null);}
 public Map<String,Object> save(String kind,Map<String,Object> item){try{jdbc.update("MERGE INTO clinic_entities (kind,id,payload) KEY(kind,id) VALUES (?,?,?)",kind,item.get("id"),mapper.writeValueAsString(item));return item;}catch(com.fasterxml.jackson.core.JsonProcessingException e){throw new IllegalStateException(e);}}
 public void lockCalendar(){jdbc.queryForList("SELECT id FROM clinic_entities WHERE kind='settings' AND id='clinic' FOR UPDATE");}
 public void lockUserManagement(){jdbc.queryForList("SELECT id FROM clinic_entities WHERE kind='settings' AND id='clinic' FOR UPDATE");}
 public void delete(String kind,String id){jdbc.update("DELETE FROM clinic_entities WHERE kind=? AND id=?",kind,id);}
 private Map<String,Object> readUser(ResultSet rs,boolean password) throws SQLException{Map<String,Object> u=new HashMap<>();for(String k:List.of("id","email","name","role"))u.put(k,rs.getString(k));if(password)u.put("password",rs.getString("password"));u.put("active",rs.getBoolean("active"));u.put("failedLoginAttempts",rs.getInt("failed_login_attempts"));Timestamp lockedUntil=rs.getTimestamp("locked_until");u.put("lockedUntil",lockedUntil==null?null:lockedUntil.toLocalDateTime());return u;}
 public Map<String,Object> user(String email){return jdbc.query("SELECT * FROM clinic_users WHERE email=?",(rs,n)->readUser(rs,true),email).stream().findFirst().orElse(null);}
 public Map<String,Object> userForLogin(String email){return jdbc.query("SELECT * FROM clinic_users WHERE email=? FOR UPDATE",(rs,n)->readUser(rs,true),email).stream().findFirst().orElse(null);}
 public Map<String,Object> userById(String id){return jdbc.query("SELECT * FROM clinic_users WHERE id=?",(rs,n)->readUser(rs,true),id).stream().findFirst().orElse(null);}
 public List<Map<String,Object>> users(){return jdbc.query("SELECT id,email,name,role,active,failed_login_attempts,locked_until FROM clinic_users ORDER BY name,email",(rs,n)->readUser(rs,false));}
 public int countUsersWithRole(String role){return jdbc.queryForObject("SELECT COUNT(*) FROM clinic_users WHERE role=?",Integer.class,role);}
 public int countActiveAdministrators(){return jdbc.queryForObject("SELECT COUNT(*) FROM clinic_users WHERE role='Administrador' AND active=TRUE",Integer.class);}
 public void addUser(Map<String,Object> u){jdbc.update("INSERT INTO clinic_users(id,email,name,role,password,active,failed_login_attempts,locked_until) VALUES(?,?,?,?,?,?,?,?)",u.get("id"),u.get("email"),u.get("name"),u.get("role"),u.get("password"),u.getOrDefault("active",true),u.getOrDefault("failedLoginAttempts",0),u.get("lockedUntil") instanceof LocalDateTime t?Timestamp.valueOf(t):null);}
 public void updateUser(Map<String,Object> u){jdbc.update("UPDATE clinic_users SET name=?,email=?,role=?,password=?,active=? WHERE id=?",u.get("name"),u.get("email"),u.get("role"),u.get("password"),u.getOrDefault("active",true),u.get("id"));}
 public void recordFailedLogin(String id,int attempts,LocalDateTime lockedUntil){jdbc.update("UPDATE clinic_users SET failed_login_attempts=?,locked_until=? WHERE id=?",attempts,lockedUntil==null?null:Timestamp.valueOf(lockedUntil),id);}
 public void resetFailedLogin(String id){jdbc.update("UPDATE clinic_users SET failed_login_attempts=0,locked_until=NULL WHERE id=?",id);}
 public void deleteUser(String id){jdbc.update("DELETE FROM clinic_users WHERE id=?",id);}
}
