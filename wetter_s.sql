-- POSTGRESQL source
-- (c) Gerhard Döppert, 2017, 
-- SPDX-License-Identifier: GPL-3.0-or-later


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



CREATE AGGREGATE taglen(wetter_home.data) (                                                                                                      
    SFUNC = tag_accum,
    STYPE = tag_state,
    INITCOND = '(0,''2000-01-01 00:00+00'',''2000-01-01 00:00+00'',0 )',
    FINALFUNC = tag_final
);


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


--
-- calculate daylight: morning, evening
--


create type tag_state as (state integer, morgen timestamp with time zone, abend timestamp with time zone, lum double precision);

CREATE FUNCTION tag_accum(agg_state tag_state, el wetter_home.data) RETURNS tag_state                                                                                                 LANGUAGE plpgsql IMMUTABLE
  AS $$ 
  begin                                                               
    if (agg_state.state = 0) -- init
    then 
      agg_state.morgen = el.mtime; 
      agg_state.abend = el.mtime; 
      agg_state.state=1; 
    end if; 
    if (el.lum_o is null) -- skip
    then 
      return agg_state; 
    end if; 
    if (agg_state.state = 1) then -- pre dawn                   
        if (el.lum_o < 10) 
        then
          agg_state.morgen = el.mtime; 
          agg_state.abend = el.mtime;
          agg_state.lum = el.lum_o;
        else  -- dawn
	      agg_state.state = 2;
	      agg_state.morgen = agg_state.morgen + (el.mtime - agg_state.morgen)*((10-agg_state.lum)/(el.lum_o-agg_state.lum));
	      agg_state.abend = agg_state.morgen; 
	    end if;
    else 
      if (agg_state.state = 2)  -- day
	  then
	    if (el.lum_o > 10)
	    then
	      agg_state.abend = el.mtime;
	      agg_state.lum = el.lum_o;
	    else   -- dusk
	      agg_state.state = 3;
	      agg_state.abend = agg_state.abend + (el.mtime - agg_state.abend)*((10-agg_state.lum)/(el.lum_o-agg_state.lum));
	    end if;
	  end if;
    end if; 
    return agg_state; 
  end;
$$;

CREATE FUNCTION tag_final(agg_state tag_state) RETURNS timestamp with time zone[2]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    begin
        return ARRAY[agg_state.morgen, agg_state.abend]; 
	end;
$$;

CREATE FUNCTION taglen_final(agg_state tag_state) RETURNS interval                                                                    
    LANGUAGE plpgsql IMMUTABLE
    AS $$             
    begin                                                               
        return agg_state.abend- agg_state.morgen; 
 end;
$$;

CREATE AGGREGATE daylen(wetter_home.data) (
    SFUNC = tag_accum,
    STYPE = tag_state,
    INITCOND = '(0,''2000-01-01 00:00+00'',''2000-01-01 00:00+00'',0 )',
    FINALFUNC = taglen_final
);

CREATE AGGREGATE dawndusk(wetter_home.data) (
    SFUNC = tag_accum,
    STYPE = tag_state,
    INITCOND = '(0,''2000-01-01 00:00+00'',''2000-01-01 00:00+00'',0 )',
    FINALFUNC = tag_final
);

-- Tables:

CREATE SCHEMA wetter_retro;


--
-- Name: data; Type: TABLE; Schema: wetter_retro; Partitioned
--

CREATE TABLE wetter_retro.data (
    stat varchar(10) NOT NULL,
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


CREATE TABLE wetter_retro.aemet_es
(
  stat character varying(10) NOT NULL,
  mtime date NOT NULL,
  tmed numeric(6,1),
  tmin numeric(6,1),
  tmax numeric(6,1),
  precip numeric(6,1),
  sun numeric(5,0),
  windf numeric(4,1),
  windd numeric(4,0),
  pres numeric(6,1),
  windf_max numeric(4,1),
  PRIMARY KEY (stat, mtime)
);

CREATE INDEX data_stat_mtime_idx
  ON wetter_retro.data
  (stat, mtime);

--
-- Name: data_dwdhist; Type: TABLE; Schema: wetter_retro; Owner: gd
--

CREATE TABLE wetter_retro.data_dwdhist (
    CONSTRAINT data_dwdhist_check CHECK (((mtime < '2016-01-01'::date) AND (stat > 0)))
)
INHERITS (data);

--
-- Name: data_dwdrecent; Type: TABLE; Schema: wetter_retro; Owner: gd
--

CREATE TABLE wetter_retro.data_dwdrecent (
    CONSTRAINT data_dwdrecent_check CHECK (((mtime >= '2016-01-01'::date) AND (stat > 0)))
)
INHERITS (data);

--
-- Name: data_homerecent; Type: TABLE; Schema: wetter_retro; Owner: gd
--

CREATE TABLE wetter_retro.data_homerecent (
    CONSTRAINT data_homerecent_check CHECK (((mtime >= '2016-01-01'::date) AND (stat = 0)))
)
INHERITS (data);


--
-- Name: data_insert_trigger(); Type: FUNCTION; Schema: wetter_retro;
--

CREATE FUNCTION wetter_retro.data_insert_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
 BEGIN
	IF (NEW.stat>0 and NEW.mtime>='2016-01-01') then INSERT INTO wetter_retro.data_dwdrecent Values(NEW.*);
	ELSIF (NEW.stat>0) then INSERT INTO wetter_retro.data_dwdhist Values(NEW.*);
	ELSE INSERT INTO wetter_retro.data_homerecent Values(NEW.*);
	END IF;
	return NULL;
END;
$$;


CREATE INDEX  ON wetter_retro.data_dwdhist USING btree (stat, mtime);


CREATE INDEX  ON wetter_retro.data_dwdrecent USING btree (stat, mtime);


CREATE INDEX  ON wetter_retro.data_homerecent USING btree (stat, mtime);


--
-- Name: wetter_retro_insert_data_trigger; Type: TRIGGER; Schema: wetter_retro; 
--

CREATE TRIGGER wetter_retro_insert_data_trigger BEFORE INSERT ON wetter_retro.data FOR EACH ROW EXECUTE PROCEDURE wetter_retro.data_insert_trigger();

-- shortcut for performance reasons, to be refreshed on insert of old data
CREATE MATERIALIZED VIEW wetter_retro.stats AS
 SELECT stat,
    date_trunc('year', min(data.mtime)) AS year
   FROM wetter_retro.data
  GROUP BY stat;

