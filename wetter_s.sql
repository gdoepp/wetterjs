-- POSTGRESQL source
-- (c) Gerhard Döppert, 2017, GNU GPL 3



-- create vector average aggregates for wind speed/direction
-- the average is taken in 2D cartesian coordinates


CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;

--
-- Name: arc_accum(double precision[], double precision[]); Type: FUNCTION; Schema: public; Owner: gd
--

CREATE FUNCTION arc_accum(agg_state double precision[], el double precision[]) RETURNS double precision[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$ 
    begin 
	  	if (el[1] is not null and el[2] is not null) 
	  	then                                                                      
			agg_state[1] := agg_state[1]+el[1]*cos(3.14159*el[2]/180);
			agg_state[2] := agg_state[2]+el[1]*sin(3.14159*el[2]/180);
			agg_state[3] := agg_state[3]+1; 
		end if;
		return agg_state;
	end;
$$;

--
-- Name: arc_avg2_final(double precision[]); Type: FUNCTION; Schema: public; Owner: gd
--

CREATE FUNCTION arc_avg2_final(agg_state double precision[]) RETURNS double precision[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare 
      t float8; 
      r float8; 
    begin
      if (agg_state[3]>0) 
      then 
        r := sqrt(agg_state[1]^2+agg_state[2]^2)/agg_state[3]; 
        t := 360+180*atan2(agg_state[2], agg_state[1])/3.14159; 
        return ARRAY[r, t - (360 * trunc(t/360))]; 
      else 
      	return ARRAY[0,0]; 
      end if;
	end;
$$;

--
-- Name: arc_avg_final(double precision[]); Type: FUNCTION; Schema: public; Owner: gd
--

CREATE FUNCTION arc_avg_final(agg_state double precision[]) RETURNS double precision
    LANGUAGE plpgsql IMMUTABLE
    AS $$
	declare 
		t float8; 
	begin
  		t := 360+180*atan2(agg_state[2], agg_state[1])/3.14159; 
  		return t - (360 * trunc(t/360));
	end;
$$;


--
-- Name: arc_avg(double precision[]); Type: AGGREGATE; Schema: public; Owner: gd
--

CREATE AGGREGATE arc_avg(double precision[]) (
    SFUNC = arc_accum,
    STYPE = double precision[],
    INITCOND = '{0,0,0}',
    FINALFUNC = arc_avg_final
);

--
-- Name: arc_avg2(double precision[]); Type: AGGREGATE; Schema: public; Owner: gd
--

CREATE AGGREGATE arc_avg2(double precision[]) (
    SFUNC = arc_accum,
    STYPE = double precision[],
    INITCOND = '{0,0,0}',
    FINALFUNC = arc_avg2_final
);

-- Tables:

CREATE SCHEMA wetter_home;

--
-- Name: data; Type: TABLE; Schema: wetter_home; Owner: gd
--

CREATE TABLE wetter_home.data (
    stat integer DEFAULT 0,
    mtime timestamp with time zone NOT NULL,
    temp_i numeric(5,1),
    temp_o numeric(5,1),
    pres numeric(6,1),
    hum_o numeric(4,1),
    precip numeric(6,1),
    cloud numeric(4,1),
    windf numeric(4,1),
    windd integer,
    sun numeric(5,0),
    primary key(stat,mtime)
);

--
-- Name: dwd_data; Type: TABLE; Schema: wetter_home; Owner: gd
--

CREATE TABLE wetter_home.dwd_data (
    stat integer NOT NULL,
    mtime timestamp with time zone NOT NULL,
    pres numeric(6,1),
    temp_o numeric(6,1),
    hum_o numeric(6,1),
    precip numeric(6,1),
    cloud numeric(4,1),
    temp_i numeric(6,1),
    windf numeric(4,1),
    windd integer,
    sun numeric(5,0),
    primary key(stat,mtime)
);


